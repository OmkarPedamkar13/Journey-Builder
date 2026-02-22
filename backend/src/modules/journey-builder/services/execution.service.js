const Journey = require('../models/Journey');
const JourneyExecution = require('../models/JourneyExecution');
const Template = require('../models/Template');
const { findRunnableJourneysByTrigger } = require('./journey.service');
const { renderTemplate, sendMessage } = require('./channel.service');
const { enqueueExecutionNode } = require('../queue/journeyQueue');

function normalizeNodeType(node) {
  return node?.data?.nodeType || node?.type || '';
}

function findTriggerNode(nodes, schema, event) {
  return (
    (nodes || []).find((node) => {
      if (normalizeNodeType(node) !== 'trigger.event') return false;
      const cfg = node.config || {};
      const nodeSchema = cfg.schema || 'lead';
      let nodeEvent = cfg.event || 'created';
      if (String(nodeEvent).includes('.')) {
        const [, eventName] = String(nodeEvent).split('.');
        nodeEvent = eventName || 'created';
      }
      return nodeSchema === schema && nodeEvent === event;
    }) || null
  );
}

function getNodeMap(nodes) {
  return new Map((nodes || []).map((node) => [node.id, node]));
}

function findNextNodeId(graph, sourceId, branch) {
  const edges = (graph?.edges || []).filter((edge) => edge.source === sourceId);
  if (!edges.length) return null;

  if (branch) {
    const byBranch = edges.find(
      (edge) => edge.branch === branch || String(edge.label || '').toLowerCase() === branch
    );
    if (byBranch) return byBranch.target;

    if (edges.length >= 2) {
      return branch === 'yes' ? edges[0].target : edges[1].target;
    }
  }

  return edges[0].target;
}

function resolveValue(current, fieldPath) {
  if (!fieldPath) return undefined;
  return String(fieldPath)
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), current);
}

function isEmpty(value) {
  return value === undefined || value === null || value === '';
}

function evaluateTrigger(config, context) {
  const expectedSchema = config?.schema || 'lead';
  if (expectedSchema !== context.schema) return false;

  let expectedEvent = config?.event || 'created';
  if (String(expectedEvent).includes('.')) {
    const [, eventName] = String(expectedEvent).split('.');
    expectedEvent = eventName || 'created';
  }
  if (expectedEvent !== context.event) return false;

  if (context.event === 'created') return true;

  const field = config?.field;
  const rule = config?.updateRule || 'any';
  const previousValue = resolveValue(context.previous || {}, field);
  const currentValue = resolveValue(context.current || {}, field);
  const changed = String(previousValue ?? '') !== String(currentValue ?? '');

  switch (rule) {
    case 'any':
      return changed;
    case 'first_time':
      return isEmpty(previousValue) && !isEmpty(currentValue);
    case 'equals':
      return String(currentValue ?? '') === String(config?.value ?? '');
    case 'contains':
      return String(currentValue ?? '')
        .toLowerCase()
        .includes(String(config?.value ?? '').toLowerCase());
    case 'from_to':
      return (
        String(previousValue ?? '') === String(config?.from ?? '')
        && String(currentValue ?? '') === String(config?.to ?? '')
      );
    default:
      return changed;
  }
}

function evaluateCondition(config, context) {
  const evaluateRule = (rule) => {
    const field = rule?.field;
    const type = rule?.ruleType || rule?.conditionType || 'exists';
    const currentValue = resolveValue(context.current || {}, field);

    if (type === 'exists') {
      return !isEmpty(currentValue);
    }

    if (type === 'equals') {
      return String(currentValue ?? '') === String(rule?.value ?? '');
    }

    if (type === 'changed') {
      const previousValue = resolveValue(context.previous || {}, field);
      const changed = String(previousValue ?? '') !== String(currentValue ?? '');
      if (!changed) return false;

      const hasFrom = rule?.from !== undefined && rule?.from !== '';
      const hasTo = rule?.to !== undefined && rule?.to !== '';

      if (hasFrom && String(previousValue ?? '') !== String(rule?.from)) return false;
      if (hasTo && String(currentValue ?? '') !== String(rule?.to)) return false;

      return true;
    }

    return false;
  };

  const evaluateGroup = (group) => {
    const items = Array.isArray(group?.items) ? group.items : [];
    if (!items.length) return false;

    const op = String(group?.operator || 'and').toLowerCase();
    const results = items.map((item) => {
      if (!item) return false;
      if (item.kind === 'group') return evaluateGroup(item);
      return evaluateRule(item);
    });

    if (op === 'or') return results.some(Boolean);
    return results.every(Boolean);
  };

  if (config?.conditionGroup && Array.isArray(config.conditionGroup.items)) {
    return evaluateGroup(config.conditionGroup);
  }

  return evaluateRule(config || {});
}

function getEntityId(current) {
  return String(current?.leadId || current?.customerId || current?.accountId || current?.id || current?._id || 'unknown');
}

function computeDelayMs(config = {}) {
  const mode = config?.mode || 'immediate';
  if (mode !== 'timer') {
    return { mode, value: 0, unit: 'seconds', delayMs: 0 };
  }

  const rawValue = Number(config?.duration ?? config?.seconds ?? 0);
  const value = Number.isFinite(rawValue) ? Math.max(0, rawValue) : 0;
  const unit = config?.unit || 'seconds';

  const msByUnit = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    months: 30 * 24 * 60 * 60 * 1000,
    years: 365 * 24 * 60 * 60 * 1000,
  };

  const factor = msByUnit[unit] || msByUnit.seconds;
  const delayMs = Math.floor(value * factor);

  return { mode, value, unit, delayMs };
}

async function appendLog(executionId, log) {
  await JourneyExecution.updateOne({ _id: executionId }, { $push: { logs: log } });
}

async function completeExecution(execution, status) {
  execution.status = status;
  execution.currentNodeId = null;
  execution.completedAt = new Date();
  await execution.save();
}

async function queueNext(execution, nextNodeId, delayMs = 0) {
  if (!nextNodeId) {
    await completeExecution(execution, 'completed');
    return;
  }

  execution.status = 'queued';
  execution.currentNodeId = nextNodeId;
  await execution.save();

  await enqueueExecutionNode({
    executionId: String(execution._id),
    nodeId: nextNodeId,
    delayMs,
  });
}

async function processExecutionNode({ executionId, nodeId }) {
  const execution = await JourneyExecution.findById(executionId);
  if (!execution) return;
  if (['completed', 'discarded', 'failed'].includes(execution.status)) return;

  const journey = await Journey.findById(execution.journeyId);
  if (!journey) {
    await appendLog(executionId, { step: 'engine', ok: false, reason: 'Journey not found' });
    await completeExecution(execution, 'failed');
    return;
  }

  const nodes = journey.graph?.nodes || [];
  const nodeMap = getNodeMap(nodes);
  const currentNodeId = nodeId || execution.currentNodeId;
  const node = nodeMap.get(currentNodeId);

  if (!node) {
    await appendLog(executionId, { step: 'engine', ok: false, reason: `Node not found: ${currentNodeId}` });
    await completeExecution(execution, 'failed');
    return;
  }

  execution.status = 'started';
  execution.currentNodeId = currentNodeId;
  await execution.save();

  const nodeType = normalizeNodeType(node);
  const config = node.config || {};
  const context = {
    schema: execution.entitySchema,
    event: execution.triggerEvent,
    current: execution.contextCurrent || {},
    previous: execution.contextPrevious || {},
  };

  if (nodeType === 'trigger.event') {
    const pass = evaluateTrigger(config, context);
    await appendLog(executionId, { step: nodeType, ok: pass, config });
    if (!pass) {
      await completeExecution(execution, 'discarded');
      return;
    }

    const nextNodeId = findNextNodeId(journey.graph, node.id);
    await queueNext(execution, nextNodeId, 0);
    return;
  }

  if (nodeType === 'wait.timer') {
    const wait = computeDelayMs(config);
    const waitedSeconds = Math.floor(wait.delayMs / 1000);
    execution.waitSeconds = Number(execution.waitSeconds || 0) + waitedSeconds;
    await execution.save();
    await appendLog(executionId, {
      step: nodeType,
      ok: true,
      mode: wait.mode,
      value: wait.value,
      unit: wait.unit,
      delayMs: wait.delayMs,
      waitedSeconds,
    });

    const nextNodeId = findNextNodeId(journey.graph, node.id);
    await queueNext(execution, nextNodeId, wait.delayMs);
    return;
  }

  if (nodeType === 'condition.check') {
    const result = evaluateCondition(config, context);
    await appendLog(executionId, { step: nodeType, ok: true, result, config });

    const nextNodeId = findNextNodeId(journey.graph, node.id, result ? 'yes' : 'no');
    await queueNext(execution, nextNodeId, 0);
    return;
  }

  if (nodeType === 'action.send.message') {
    const channel = config.channel || 'email';
    let templateBody = config.templateBody || 'Hello {{entity.firstName}}';
    let subject = config.subject || process.env.EMAIL_DEFAULT_SUBJECT || 'Journey Update';
    let contentType = config.contentType || 'html';
    let resolvedTemplateId = null;

    if (channel === 'email' && config.templateId) {
      const selectedTemplate = await Template.findById(config.templateId);
      if (selectedTemplate) {
        resolvedTemplateId = selectedTemplate._id;
        templateBody = selectedTemplate.body || templateBody;
        subject = selectedTemplate.subject || subject;
        contentType = selectedTemplate.contentType || contentType;
      }
    }

    const message = renderTemplate(templateBody, context.current || {}, context.schema);

    let sendResult;
    try {
      sendResult = await sendMessage({
        channel,
        lead: context.current,
        message,
        subject,
        contentType,
      });
    } catch (error) {
      await appendLog(executionId, {
        step: nodeType,
        ok: false,
        channel,
        reason: error.message || 'Send failed',
      });
      await completeExecution(execution, 'failed');
      return;
    }

    execution.channel = channel;
    execution.messagePreview = message;
    await execution.save();

    await appendLog(executionId, {
      step: nodeType,
      ok: true,
      channel,
      to: sendResult?.to || null,
      accepted: Boolean(sendResult?.accepted),
      reason: sendResult?.reason || null,
      templateId: resolvedTemplateId,
      providerMessageId: sendResult?.providerMessageId || null,
    });

    const nextNodeId = findNextNodeId(journey.graph, node.id);
    await queueNext(execution, nextNodeId, 0);
    return;
  }

  if (nodeType === 'end.discard') {
    await appendLog(executionId, { step: nodeType, ok: true });
    await completeExecution(execution, 'discarded');
    return;
  }

  if (nodeType === 'end.success') {
    await appendLog(executionId, { step: nodeType, ok: true });
    await completeExecution(execution, 'completed');
    return;
  }

  await appendLog(executionId, { step: nodeType, ok: false, reason: 'Unsupported node type' });
  await completeExecution(execution, 'failed');
}

async function enqueueJourneysForEvent({ schema, event, current, previous, options = {} }) {
  if (!schema || !event) {
    const error = new Error('schema and event are required');
    error.status = 400;
    throw error;
  }

  if (!current || typeof current !== 'object') {
    const error = new Error('current payload is required');
    error.status = 400;
    throw error;
  }

  const journeys = await findRunnableJourneysByTrigger(schema, event, options);
  if (!journeys.length) {
    return { total: 0, enqueued: [] };
  }

  const enqueued = [];

  for (const journey of journeys) {
    const triggerNode = findTriggerNode(journey.graph?.nodes || [], schema, event);
    if (!triggerNode) continue;

    const execution = await JourneyExecution.create({
      journeyId: journey._id,
      entitySchema: schema,
      entityId: getEntityId(current),
      triggerEvent: event,
      status: 'queued',
      logs: [{ step: 'engine', ok: true, message: 'Execution queued' }],
      contextCurrent: current,
      contextPrevious: previous || {},
      currentNodeId: triggerNode.id,
      startedAt: new Date(),
    });

    await enqueueExecutionNode({
      executionId: String(execution._id),
      nodeId: triggerNode.id,
      delayMs: 0,
    });

    enqueued.push({
      executionId: execution._id,
      journeyId: journey._id,
      journeyName: journey.name,
    });
  }

  return { total: enqueued.length, enqueued };
}

async function listExecutions() {
  return JourneyExecution.find().sort({ createdAt: -1 }).limit(200);
}

async function getExecutionById(id) {
  return JourneyExecution.findById(id);
}

module.exports = {
  enqueueJourneysForEvent,
  processExecutionNode,
  listExecutions,
  getExecutionById,
};
