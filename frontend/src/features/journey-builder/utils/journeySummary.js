function getNodeType(node) {
  return node?.data?.nodeType || node?.type || 'unknown';
}

function getOutEdges(edges, sourceId) {
  return (edges || []).filter((edge) => edge.source === sourceId);
}

function findBranchEdge(edges, branch) {
  return edges.find(
    (edge) => edge.branch === branch || String(edge.label || '').toLowerCase() === branch
  );
}

function formatTrigger(config = {}) {
  const schema = config.schema || 'lead';
  const event = config.event || 'created';

  if (event === 'created') {
    return `WHEN ${schema} is created`;
  }

  const field = config.field || '(field)';
  const rule = config.updateRule || 'any';
  if (rule === 'first_time') return `WHEN ${schema}.${field} is updated first time`;
  if (rule === 'equals') return `WHEN ${schema}.${field} equals "${config.value || ''}"`;
  if (rule === 'contains') return `WHEN ${schema}.${field} contains "${config.value || ''}"`;
  if (rule === 'from_to') {
    return `WHEN ${schema}.${field} changes from "${config.from || ''}" to "${config.to || ''}"`;
  }

  return `WHEN ${schema}.${field} is updated`;
}

function formatWait(config = {}) {
  const mode = config.mode || 'immediate';
  if (mode !== 'timer') return 'THEN continue immediately';
  const duration = Number(config.duration ?? config.seconds ?? 0);
  const unit = config.unit || 'seconds';
  return `THEN wait ${duration} ${unit}`;
}

function formatConditionRule(rule = {}, defaultSchema = 'lead') {
  const schema = rule.schema || defaultSchema;
  const field = rule.field || '(field)';
  const type = rule.ruleType || rule.conditionType || 'exists';

  if (type === 'exists') return `${schema}.${field} exists`;
  if (type === 'equals') return `${schema}.${field} equals "${rule.value || ''}"`;
  if (type === 'changed') {
    const from = rule.from ? ` from "${rule.from}"` : '';
    const to = rule.to ? ` to "${rule.to}"` : '';
    return `${schema}.${field} changed${from}${to}`;
  }

  return `${schema}.${field} ${type}`;
}

function formatConditionGroup(group, defaultSchema) {
  if (!group || !Array.isArray(group.items) || group.items.length === 0) return 'condition';
  const operator = String(group.operator || 'and').toUpperCase();
  const parts = group.items.map((item) => {
    if (item?.kind === 'group') return `(${formatConditionGroup(item, defaultSchema)})`;
    return formatConditionRule(item, defaultSchema);
  });
  return parts.join(` ${operator} `);
}

function formatCondition(config = {}) {
  if (config.conditionGroup) {
    return formatConditionGroup(config.conditionGroup, config.schema || 'lead');
  }

  return formatConditionRule(
    {
      ruleType: config.conditionType,
      field: config.field,
      value: config.value,
      from: config.from,
      to: config.to,
    },
    config.schema || 'lead'
  );
}

function formatAction(config = {}) {
  const channel = config.channel || 'email';
  if (channel === 'email' && config.templateId) {
    return `SEND ${channel.toUpperCase()} using saved template`;
  }
  return `SEND ${channel.toUpperCase()} message`;
}

function formatNode(node) {
  const nodeType = getNodeType(node);
  const config = node.config || {};

  if (nodeType === 'trigger.event') return formatTrigger(config);
  if (nodeType === 'wait.timer') return formatWait(config);
  if (nodeType === 'condition.check') return `IF ${formatCondition(config)}`;
  if (nodeType === 'action.send.message') return formatAction(config);
  if (nodeType === 'end.success') return 'END with success';
  if (nodeType === 'end.discard') return 'END and discard';
  return node?.data?.label || nodeType;
}

function walk(nodeId, nodeMap, edges, lines, indent = 0, path = new Set()) {
  if (!nodeId || path.has(nodeId)) {
    if (path.has(nodeId)) lines.push(`${'  '.repeat(indent)}(loop detected)`);
    return;
  }

  const node = nodeMap.get(nodeId);
  if (!node) return;

  const nodeType = getNodeType(node);
  const prefix = '  '.repeat(indent);

  if (nodeType === 'condition.check') {
    lines.push(`${prefix}${formatNode(node)}`);
    const out = getOutEdges(edges, nodeId);
    const yesEdge = findBranchEdge(out, 'yes') || out[0];
    const noEdge = findBranchEdge(out, 'no') || out[1];

    lines.push(`${prefix}  THEN`);
    walk(yesEdge?.target, nodeMap, edges, lines, indent + 2, new Set([...path, nodeId]));

    lines.push(`${prefix}  ELSE`);
    walk(noEdge?.target, nodeMap, edges, lines, indent + 2, new Set([...path, nodeId]));
    return;
  }

  lines.push(`${prefix}${formatNode(node)}`);

  if (nodeType === 'end.success' || nodeType === 'end.discard') return;

  const out = getOutEdges(edges, nodeId);
  const next = out[0]?.target;
  walk(next, nodeMap, edges, lines, indent, new Set([...path, nodeId]));
}

export function buildJourneyPseudoCode(nodes = [], edges = []) {
  const nodeMap = new Map((nodes || []).map((node) => [node.id, node]));
  const trigger =
    (nodes || []).find((node) => getNodeType(node) === 'trigger.event') || nodes?.[0] || null;

  if (!trigger) return 'No nodes yet. Add a Trigger node to start building the journey.';

  const lines = ['FLOW SUMMARY'];
  walk(trigger.id, nodeMap, edges, lines, 0, new Set());
  return lines.join('\n');
}

