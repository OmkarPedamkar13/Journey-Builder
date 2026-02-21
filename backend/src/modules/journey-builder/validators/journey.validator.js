const { z } = require('zod');

const ALLOWED_NODE_TYPES = [
  'trigger.event',
  'wait.timer',
  'condition.check',
  'condition.field.exists',
  'condition.field.equals',
  'condition.field.changed',
  'action.send.message',
  'end.discard',
  'end.success',
];

const nodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().min(1),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    data: z.record(z.any()).optional(),
    config: z.record(z.any()).optional(),
  })
  .passthrough();

const edgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    branch: z.enum(['yes', 'no']).optional(),
    label: z.string().optional(),
  })
  .passthrough();

const graphSchema = z.object({
  nodes: z.array(nodeSchema).min(1),
  edges: z.array(edgeSchema).min(1),
  settings: z.record(z.any()).default({}),
});

function detectTriggerEvent(nodes) {
  const trigger = nodes.find((node) => node?.data?.nodeType === 'trigger.event' || node?.type === 'trigger.event');
  const schema = trigger?.config?.schema || 'lead';
  const event = trigger?.config?.event || 'created';

  if (String(event).includes('.')) {
    const [eventSchema, eventName] = String(event).split('.');
    return { triggerSchema: eventSchema || schema, triggerEvent: eventName || 'created' };
  }

  return { triggerSchema: schema, triggerEvent: event };
}

function validateJourneyPayload(payload) {
  const graph = payload?.graph;
  if (!graph) {
    return { valid: false, errors: ['graph is required'], graph: null, triggerEvent: null };
  }

  const parsed = graphSchema.safeParse(graph);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const path = issue.path.length ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    });
    return { valid: false, errors, graph: null, triggerEvent: null };
  }

  const normalizedNodes = parsed.data.nodes.map((node) => {
    const nodeType = node.data?.nodeType || node.type;
    return {
      ...node,
      data: {
        ...(node.data || {}),
        nodeType,
      },
    };
  });

  const invalidType = normalizedNodes.find((node) => !ALLOWED_NODE_TYPES.includes(node.data.nodeType));
  if (invalidType) {
    return {
      valid: false,
      errors: [`Unsupported node type: ${invalidType.data.nodeType}`],
      graph: null,
      triggerEvent: null,
    };
  }

  const triggerCount = normalizedNodes.filter((node) => node.data.nodeType === 'trigger.event').length;
  if (triggerCount !== 1) {
    return {
      valid: false,
      errors: ['Journey must contain exactly one Trigger node'],
      graph: null,
      triggerEvent: null,
      triggerSchema: null,
    };
  }

  const triggerConfig = normalizedNodes.find((node) => node.data.nodeType === 'trigger.event')?.config || {};
  const detected = detectTriggerEvent(normalizedNodes);
  const allowedEvents = ['created', 'updated'];

  if (!allowedEvents.includes(detected.triggerEvent)) {
    return {
      valid: false,
      errors: ['Trigger event must be created or updated'],
      graph: null,
      triggerEvent: null,
      triggerSchema: null,
    };
  }

  return {
    valid: true,
    errors: [],
    graph: {
      ...parsed.data,
      nodes: normalizedNodes,
    },
    triggerSchema: payload?.triggerSchema || triggerConfig.schema || detected.triggerSchema,
    triggerEvent: payload?.triggerEvent || detected.triggerEvent,
  };
}

module.exports = { validateJourneyPayload };
