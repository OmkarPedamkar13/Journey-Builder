import { createSlice } from '@reduxjs/toolkit';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { createDefaultJourneyGraph } from '../utils/workflow';

const initialGraph = createDefaultJourneyGraph();

const initialState = {
  currentJourneyId: null,
  name: 'Lead Journey',
  nodes: initialGraph.nodes,
  edges: initialGraph.edges,
  selectedNodeId: null,
  selectedEdgeId: null,
};

const journeyBuilderSlice = createSlice({
  name: 'journeyBuilder',
  initialState,
  reducers: {
    setCurrentJourneyId(state, action) {
      state.currentJourneyId = action.payload || null;
    },
    setJourneyName(state, action) {
      state.name = action.payload;
    },
    onNodesChange(state, action) {
      state.nodes = applyNodeChanges(action.payload, state.nodes);
    },
    onEdgesChange(state, action) {
      state.edges = applyEdgeChanges(action.payload, state.edges);
      if (state.selectedEdgeId && !state.edges.find((edge) => edge.id === state.selectedEdgeId)) {
        state.selectedEdgeId = null;
      }
    },
    onConnectEdge(state, action) {
      const connection = action.payload;
      const sourceNode = state.nodes.find((node) => node.id === connection.source);
      const sourceType = sourceNode?.data?.nodeType;
      const isConditionSource = String(sourceType || '').startsWith('condition.');
      const outgoingCount = state.edges.filter((edge) => edge.source === connection.source).length;

      let branch;
      let label;
      if (isConditionSource) {
        branch = outgoingCount === 0 ? 'yes' : outgoingCount === 1 ? 'no' : undefined;
        label = branch ? branch.toUpperCase() : undefined;
      }

      state.edges = addEdge(
        {
          ...connection,
          id: `e_${connection.source}_${connection.target}_${Date.now()}`,
          branch,
          label,
        },
        state.edges
      );
    },
    addJourneyNode(state, action) {
      state.nodes.push(action.payload);
      state.selectedNodeId = action.payload.id;
      state.selectedEdgeId = null;
    },
    selectNode(state, action) {
      state.selectedNodeId = action.payload;
      state.selectedEdgeId = null;
    },
    selectEdge(state, action) {
      state.selectedEdgeId = action.payload;
      state.selectedNodeId = null;
    },
    clearSelection(state) {
      state.selectedNodeId = null;
      state.selectedEdgeId = null;
    },
    updateNodeConfig(state, action) {
      const { nodeId, patch } = action.payload;
      state.nodes = state.nodes.map((node) => {
        if (node.id !== nodeId) return node;

        return {
          ...node,
          config: {
            ...(node.config || {}),
            ...patch,
          },
        };
      });
    },
    removeSelectedNode(state) {
      const nodeId = state.selectedNodeId;
      if (!nodeId) return;
      state.nodes = state.nodes.filter((node) => node.id !== nodeId);
      state.edges = state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
      state.selectedNodeId = state.nodes[0]?.id || null;
      state.selectedEdgeId = null;
    },
    duplicateNode(state, action) {
      const sourceNodeId = action.payload || state.selectedNodeId;
      if (!sourceNodeId) return;

      const sourceNode = state.nodes.find((node) => node.id === sourceNodeId);
      if (!sourceNode) return;

      const duplicate = {
        ...cloneValue(sourceNode),
        id: makeNodeId(sourceNode?.data?.nodeType),
        position: {
          x: (sourceNode?.position?.x || 0) + 40,
          y: (sourceNode?.position?.y || 0) + 40,
        },
      };

      state.nodes.push(duplicate);
      state.selectedNodeId = duplicate.id;
      state.selectedEdgeId = null;
    },
    removeSelectedEdge(state) {
      const edgeId = state.selectedEdgeId;
      if (!edgeId) return;
      state.edges = state.edges.filter((edge) => edge.id !== edgeId);
      state.selectedEdgeId = null;
    },
    resetJourneyGraph(state) {
      const next = createDefaultJourneyGraph();
      state.nodes = next.nodes;
      state.edges = next.edges;
      state.selectedNodeId = null;
      state.selectedEdgeId = null;
    },
    loadJourneyGraph(state, action) {
      const journey = action.payload;
      state.currentJourneyId = journey?._id || null;
      state.name = journey.name || 'Lead Journey';
      state.nodes = journey?.graph?.nodes || [];
      state.edges = journey?.graph?.edges || [];
      state.selectedNodeId = (journey?.graph?.nodes || [])[0]?.id || null;
      state.selectedEdgeId = null;
    },
    createNewJourney(state) {
      const next = createDefaultJourneyGraph();
      state.currentJourneyId = null;
      state.name = 'Untitled Journey';
      state.nodes = next.nodes;
      state.edges = next.edges;
      state.selectedNodeId = null;
      state.selectedEdgeId = null;
    },
  },
});

export const {
  setCurrentJourneyId,
  setJourneyName,
  onNodesChange,
  onEdgesChange,
  onConnectEdge,
  addJourneyNode,
  selectNode,
  selectEdge,
  clearSelection,
  updateNodeConfig,
  removeSelectedNode,
  removeSelectedEdge,
  resetJourneyGraph,
  loadJourneyGraph,
  createNewJourney,
} = journeyBuilderSlice.actions;

export default journeyBuilderSlice.reducer;
