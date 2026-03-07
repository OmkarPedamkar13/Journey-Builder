function isEndNode(nodeType) {
  return nodeType === 'end.discard' || nodeType === 'end.success';
}

function hasAnyConditionRule(group) {
  if (!group || !Array.isArray(group.items)) return false;
  return group.items.some((item) => {
    if (!item) return false;
    if (item.kind === 'group') return hasAnyConditionRule(item);
    return Boolean(item.field);
  });
}

export function validateJourneyGraph(nodes, edges) {
  const errors = [];

  if (!nodes.length) {
    errors.push('Journey canvas is empty. Add nodes first.');
    return { valid: false, errors };
  }

  const triggers = nodes.filter((node) => node?.data?.nodeType === 'trigger.event');
  if (triggers.length !== 1) {
    errors.push('Journey must contain exactly one Trigger node.');
  }

  const endNodes = nodes.filter((node) => isEndNode(node?.data?.nodeType));
  if (!endNodes.length) {
    errors.push('Journey must contain at least one End node (Success or Discard).');
  }

  nodes.forEach((node) => {
    const nodeType = node?.data?.nodeType;
    const outgoing = edges.filter((edge) => edge.source === node.id);

    if (!isEndNode(nodeType) && outgoing.length === 0) {
      errors.push(`Node ${nodeType} has no outgoing connection.`);
    }

    if (String(nodeType).startsWith('condition.') && outgoing.length < 2) {
      errors.push(`Condition node ${nodeType} should have Yes and No branches.`);
    }
    if (nodeType === 'split.router') {
      const branches = Array.isArray(node?.config?.branches) ? node.config.branches : [];
      if (!branches.length) {
        errors.push('Split node must have at least one branch configured.');
      }
      if (outgoing.length < 1) {
        errors.push('Split node should have at least one connected branch.');
      }
      if (branches.length && outgoing.length > branches.length) {
        errors.push('Split node has more edges than configured branches.');
      }
      branches.forEach((branch, index) => {
        if (!branch?.field) {
          errors.push(`Split branch ${index + 1} must include a field.`);
        }
      });
    }

    if (nodeType === 'condition.check') {
      const group = node?.config?.conditionGroup;
      const legacyField = node?.config?.field;
      if (!hasAnyConditionRule(group) && !legacyField) {
        errors.push('Condition node must include at least one configured condition field.');
      }
    }
  });

  return { valid: errors.length === 0, errors };
}
