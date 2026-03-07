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
      const isSplitSource = String(sourceType || '') === 'split.router';
      const outgoingEdges = state.edges.filter((edge) => edge.source === connection.source);

      let branch;
      let label;
      if (isConditionSource) {
        // Condition node supports exactly 2 branches: YES and NO.
        if (outgoingEdges.length >= 2) return;

        const usedBranches = new Set(
          outgoingEdges.map((edge) => String(edge.branch || edge.label || '').toLowerCase()).filter(Boolean)
        );
        const availableBranches = ['yes', 'no'].filter((item) => !usedBranches.has(item));
        branch = availableBranches[0];

        if (!branch) return;
        label = branch ? branch.toUpperCase() : undefined;
      } else if (isSplitSource) {
        const branches = Array.isArray(sourceNode?.config?.branches) ? sourceNode.config.branches : [];
        if (!branches.length) return;
        if (outgoingEdges.length >= branches.length) return;

        const used = new Set(outgoingEdges.map((edge) => String(edge.branch || '')));
        const available = branches.find((item) => item?.id && !used.has(String(item.id)));
        if (!available) return;

        branch = String(available.id);
        label = String(available.label || available.id);
      } else {
        // All other node types support only one outgoing edge.
        if (outgoingEdges.length >= 1) return;
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

      if (Array.isArray(patch?.branches)) {
        const node = state.nodes.find((item) => item.id === nodeId);
        const isSplit = String(node?.data?.nodeType || '') === 'split.router';
        if (isSplit) {
          const allowedBranchIds = new Set(patch.branches.map((item) => String(item?.id || '')));
          state.edges = state.edges.filter((edge) => {
            if (edge.source !== nodeId) return true;
            if (!edge.branch) return false;
            return allowedBranchIds.has(String(edge.branch));
          });
          if (state.selectedEdgeId && !state.edges.find((edge) => edge.id === state.selectedEdgeId)) {
            state.selectedEdgeId = null;
          }
        }
      }
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
