function isEndNode(nodeType) {
  return nodeType === 'end.discard' || nodeType === 'end.success';
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
  });

  return { valid: errors.length === 0, errors };
}
