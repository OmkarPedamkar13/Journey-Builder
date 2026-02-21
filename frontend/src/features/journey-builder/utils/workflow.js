import { NODE_TYPES, getNodeLibraryItem } from './nodeCatalog';

export function createNode(type, position) {
  const item = getNodeLibraryItem(type);
  const nodeId = `${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  return {
    id: nodeId,
    type: 'journeyNode',
    position,
    data: {
      nodeType: type,
      label: item?.label || type,
    },
    config: item?.defaultConfig || {},
  };
}

export function createEmptyJourneyGraph() {
  return {
    nodes: [],
    edges: [],
    settings: {},
  };
}

export function createDefaultJourneyGraph() {
  return createEmptyJourneyGraph();
}

export function extractTriggerEvent(nodes) {
  const trigger = (nodes || []).find((node) => node?.data?.nodeType === NODE_TYPES.TRIGGER_EVENT);
  const rawEvent = trigger?.config?.event || 'created';

  if (String(rawEvent).includes('.')) {
    const [, eventName] = String(rawEvent).split('.');
    return eventName || 'created';
  }

  return rawEvent;
}

export function extractTriggerSchema(nodes) {
  const trigger = (nodes || []).find((node) => node?.data?.nodeType === NODE_TYPES.TRIGGER_EVENT);
  return trigger?.config?.schema || 'lead';
}
