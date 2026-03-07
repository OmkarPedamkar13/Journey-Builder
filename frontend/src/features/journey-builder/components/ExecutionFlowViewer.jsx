import { useMemo } from 'react';
import { Background, Controls, ReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import JourneyFlowNode from './JourneyFlowNode';

const nodeTypes = {
  journeyNode: JourneyFlowNode,
};

function buildExecutionTrace(graph = {}, logs = []) {
  const edges = graph?.edges || [];
  const nodeLogs = (logs || []).filter((log) => log?.nodeId);
  const visitedNodeIds = new Set(nodeLogs.map((log) => String(log.nodeId)));

  const failedLog = [...nodeLogs].reverse().find((log) => log.ok === false);
  const failedNodeId = failedLog?.nodeId ? String(failedLog.nodeId) : null;

  const traversedEdges = new Set();
  const firstSeenIndexByNodeId = new Map();
  nodeLogs.forEach((log, index) => {
    const key = String(log.nodeId);
    if (!firstSeenIndexByNodeId.has(key)) {
      firstSeenIndexByNodeId.set(key, index);
    }
  });

  for (let i = 0; i < nodeLogs.length - 1; i += 1) {
    const source = String(nodeLogs[i].nodeId);
    let j = i + 1;
    while (j < nodeLogs.length && String(nodeLogs[j].nodeId) === source) {
      j += 1;
    }
    if (j >= nodeLogs.length) continue;
    const target = String(nodeLogs[j].nodeId);
    const edge = edges.find((item) => String(item.source) === source && String(item.target) === target);
    if (edge?.id) traversedEdges.add(String(edge.id));
  }

  nodeLogs.forEach((log) => {
    const sourceId = String(log.nodeId);
    if (log.step === 'condition.check') {
      const branch = log.result ? 'yes' : 'no';
      const edge = edges.find(
        (item) =>
          String(item.source) === sourceId
          && (String(item.branch || '').toLowerCase() === branch
            || String(item.label || '').toLowerCase() === branch)
      );
      if (edge?.id) traversedEdges.add(String(edge.id));
    }

    if (log.step === 'split.router' && Array.isArray(log.targets)) {
      log.targets.forEach((target) => {
        const edge = edges.find(
          (item) => String(item.source) === sourceId && String(item.target) === String(target)
        );
        if (edge?.id) traversedEdges.add(String(edge.id));
      });
    }
  });

  return {
    visitedNodeIds,
    failedNodeId,
    startNodeId: nodeLogs[0]?.nodeId ? String(nodeLogs[0].nodeId) : null,
    lastNodeId: nodeLogs[nodeLogs.length - 1]?.nodeId
      ? String(nodeLogs[nodeLogs.length - 1].nodeId)
      : null,
    firstSeenIndexByNodeId,
    traversedEdges,
  };
}

function mergeTraceMaps(graph = {}, traces = []) {
  const nodeStateMap = new Map(); // nodeId -> Set(states)
  const edgeStateMap = new Map(); // edgeId -> Set(states)
  const firstStepMap = new Map(); // nodeId -> min step index
  const startNodeIds = new Set();

  const tagForStatus = (status) => {
    if (status === 'failed') return 'failed';
    if (status === 'completed') return 'success';
    if (status === 'discarded') return 'discarded';
    return 'running';
  };

  traces.forEach((item) => {
    const statusTag = tagForStatus(item?.status);
    const trace = buildExecutionTrace(graph, item?.logs || []);

    if (trace.startNodeId) startNodeIds.add(trace.startNodeId);

    trace.visitedNodeIds.forEach((nodeId) => {
      const current = nodeStateMap.get(nodeId) || new Set();
      current.add('path');
      current.add(statusTag);
      nodeStateMap.set(nodeId, current);
    });

    if (trace.failedNodeId) {
      const current = nodeStateMap.get(trace.failedNodeId) || new Set();
      current.add('failed');
      nodeStateMap.set(trace.failedNodeId, current);
    }

    trace.traversedEdges.forEach((edgeId) => {
      const current = edgeStateMap.get(edgeId) || new Set();
      current.add(statusTag);
      edgeStateMap.set(edgeId, current);
    });

    trace.firstSeenIndexByNodeId.forEach((index, nodeId) => {
      const prev = firstStepMap.get(nodeId);
      if (prev === undefined || index < prev) firstStepMap.set(nodeId, index);
    });
  });

  return { nodeStateMap, edgeStateMap, firstStepMap, startNodeIds };
}

function resolveNodeExecutionState(stateSet) {
  if (!stateSet || !stateSet.size) return 'idle';
  if (stateSet.has('failed')) return 'failed';
  if (stateSet.has('success') && !stateSet.has('failed')) return 'success';
  if (stateSet.has('path')) return 'path';
  return 'visited';
}

function resolveEdgeColor(stateSet) {
  if (!stateSet || !stateSet.size) return '#94a3b8';
  if (stateSet.has('failed')) return '#ef4444';
  if (stateSet.has('success')) return '#22c55e';
  if (stateSet.has('discarded')) return '#f59e0b';
  return '#3b82f6';
}

function ViewerInner({ graph, executions }) {
  const merged = useMemo(() => mergeTraceMaps(graph, executions), [graph, executions]);
  const baseNodes = graph?.nodes || [];
  const baseEdges = graph?.edges || [];

  const nodes = baseNodes.map((node) => {
    const id = String(node.id);
    const stateSet = merged.nodeStateMap.get(id);
    const executionState = resolveNodeExecutionState(stateSet);

    return {
      ...node,
      type: 'journeyNode',
      data: {
        ...(node.data || {}),
        executionState,
        executionIsStart: merged.startNodeIds.has(id),
        executionStepIndex: merged.firstStepMap.has(id)
          ? merged.firstStepMap.get(id)
          : null,
      },
      style: {
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
      },
      draggable: false,
      selectable: false,
    };
  });

  const edges = baseEdges.map((edge) => {
    const edgeId = String(edge.id);
    const stateSet = merged.edgeStateMap.get(edgeId);
    const isTraversed = Boolean(stateSet?.size);
    const color = resolveEdgeColor(stateSet);
    return {
      ...edge,
      type: 'bezier',
      animated: isTraversed,
      style: {
        stroke: color,
        strokeWidth: isTraversed ? 3 : 2,
      },
      labelStyle: { fill: '#334155', fontWeight: 700 },
      selectable: false,
    };
  });

  return (
    <div className="journey-canvas-shell" style={{ width: '100%', height: 560 }}>
      <ReactFlow fitView proOptions={{ hideAttribution: true }} nodeTypes={nodeTypes} nodes={nodes} edges={edges}>
        <Controls />
        <Background gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}

export default function ExecutionFlowViewer({ graph, executions }) {
  return (
    <ReactFlowProvider>
      <ViewerInner graph={graph} executions={executions} />
    </ReactFlowProvider>
  );
}
