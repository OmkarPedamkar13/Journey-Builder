import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  addJourneyNode,
  clearSelection,
  onConnectEdge,
  onEdgesChange,
  onNodesChange,
  selectEdge,
  selectNode,
} from '../slice/journeyBuilderSlice';
import { createNode } from '../utils/workflow';
import JourneyFlowNode from './JourneyFlowNode';

const nodeTypes = {
  journeyNode: JourneyFlowNode,
};

function CanvasInner() {
  const dispatch = useDispatch();
  const { nodes, edges, selectedEdgeId } = useSelector((state) => state.journeyBuilder);
  const reactFlow = useReactFlow();
  const wrapperRef = useRef(null);

  const decoratedEdges = edges.map((edge) => ({
    ...edge,
    type: 'bezier',
    animated: edge.id === selectedEdgeId,
    style: {
      stroke: edge.id === selectedEdgeId ? '#0ea5e9' : '#94a3b8',
      strokeWidth: edge.id === selectedEdgeId ? 3 : 2,
    },
    labelStyle: { fill: '#334155', fontWeight: 700 },
  }));

  const renderedNodes = nodes.map((node) => ({
    ...node,
    type: 'journeyNode',
    style: {
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      padding: 0,
    },
  }));

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      dispatch(addJourneyNode(createNode(type, position)));
    },
    [dispatch, reactFlow]
  );

  return (
    <div
      ref={wrapperRef}
      className="journey-canvas-shell"
      style={{ width: '100%', height: 560 }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={onDrop}
    >
      <ReactFlow
        fitView
        proOptions={{ hideAttribution: true }}
        nodeTypes={nodeTypes}
        nodes={renderedNodes}
        edges={decoratedEdges}
        onNodesChange={(changes) => dispatch(onNodesChange(changes))}
        onEdgesChange={(changes) => dispatch(onEdgesChange(changes))}
        onConnect={(connection) => dispatch(onConnectEdge(connection))}
        onNodeClick={(_event, node) => dispatch(selectNode(node.id))}
        onEdgeClick={(_event, edge) => dispatch(selectEdge(edge.id))}
        onPaneClick={() => dispatch(clearSelection())}
      >
        <Controls />
        <Background gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}

export default function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
