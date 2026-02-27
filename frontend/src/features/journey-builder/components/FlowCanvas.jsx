import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  addJourneyNode,
  clearSelection,
  onConnectEdge,
  onEdgesChange,
  onNodesChange,
  selectEdge,
  selectNode,
  removeSelectedNode,
  removeSelectedEdge,
} from "../slice/journeyBuilderSlice";
import { createNode } from "../utils/workflow";
import JourneyFlowNode from "./JourneyFlowNode";
import NodeContextMenu from "./NodeContextMenu";
import { Button, Tooltip } from "antd";
import { FullscreenOutlined, FullscreenExitOutlined } from "@ant-design/icons";
import EdgeContextMenu from "./EdgeContextMenu";

const nodeTypes = {
  journeyNode: JourneyFlowNode,
};

function CanvasInner() {
  const dispatch = useDispatch();
  const { nodes, edges, selectedEdgeId } = useSelector(
    (state) => state.journeyBuilder,
  );
  const reactFlow = useReactFlow();
  const wrapperRef = useRef(null);
  const [edgeMenu, setEdgeMenu] = useState({
    open: false,
    x: 0,
    y: 0,
    edge: null,
  });

  const closeEdgeMenu = useCallback(() => {
    setEdgeMenu((p) => ({ ...p, open: false, edge: null }));
  }, []);
  const openEdgeMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
      event.stopPropagation();

      dispatch(selectEdge(edge.id)); // ✅ IMPORTANT

      setEdgeMenu({
        open: true,
        x: event.clientX,
        y: event.clientY,
        edge,
      });
    },
    [dispatch],
  );

  const handleEdgeMenuAction = useCallback(
    (action, edge) => {
      console.log("Edge menu action:", action, edge?.id);

      if (action === "delete") {
        dispatch(removeSelectedEdge()); // ✅ SAME AS BUTTON
      }

      closeEdgeMenu(); // close menu after action
    },
    [dispatch, closeEdgeMenu],
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el) return;

    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  const [contextMenu, setContextMenu] = useState({
    open: false,
    x: 0,
    y: 0,
    node: null,
  });

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, open: false, node: null }));
  }, []);

  const openNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      event.stopPropagation();

      dispatch(selectNode(node.id));

      setContextMenu({
        open: true,
        x: event.clientX,
        y: event.clientY,
        node,
      });
    },
    [dispatch],
  );

  const handleMenuAction = useCallback(
    (action, node) => {
      console.log("Node menu action:", action, "node:", node?.id);

      if (action === "delete") {
        dispatch(removeSelectedNode()); // ✅ SAME AS BUTTON
      }

      if (action === "edit") {
        console.log("Edit node", node.id);
      }

      if (action === "duplicate") {
        console.log("Duplicate node", node.id);
      }

      closeContextMenu(); // close menu after action
    },
    [dispatch, closeContextMenu],
  );

  const decoratedEdges = edges.map((edge) => ({
    ...edge,
    type: "bezier",
    animated: edge.id === selectedEdgeId,
    style: {
      stroke: edge.id === selectedEdgeId ? "#0ea5e9" : "#94a3b8",
      strokeWidth: edge.id === selectedEdgeId ? 3 : 2,
    },
    labelStyle: { fill: "#334155", fontWeight: 700 },
  }));

  const renderedNodes = nodes.map((node) => ({
    ...node,
    type: "journeyNode",
    style: {
      background: "transparent",
      border: "none",
      boxShadow: "none",
      padding: 0,
    },
  }));

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      dispatch(addJourneyNode(createNode(type, position)));
    },
    [dispatch, reactFlow],
  );

  return (
    <div
      ref={wrapperRef}
      className="journey-canvas-shell"
      style={{ width: "100%", height: 560, position: "relative" }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={onDrop}
    >
      {/* ✅ Top-right fullscreen button */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 50 }}>
        <Tooltip title={isFullscreen ? "Exit Full Screen" : "Full Screen"}>
          <Button
            icon={
              isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
            }
            onClick={toggleFullscreen}
          />
        </Tooltip>
      </div>
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
        onPaneClick={() => {
          dispatch(clearSelection());
          closeContextMenu(); // node menu close if you have it
          closeEdgeMenu(); // ✅ edge menu close
        }}
        onNodeContextMenu={openNodeContextMenu}
        onEdgeContextMenu={openEdgeMenu}
      >
        <Controls />
        <Background gap={20} size={1} />
      </ReactFlow>

      <NodeContextMenu
        open={contextMenu.open}
        x={contextMenu.x}
        y={contextMenu.y}
        node={contextMenu.node}
        onClose={closeContextMenu}
        onAction={handleMenuAction}
      />
      <EdgeContextMenu
        open={edgeMenu.open}
        x={edgeMenu.x}
        y={edgeMenu.y}
        edge={edgeMenu.edge}
        onClose={closeEdgeMenu}
        onAction={handleEdgeMenuAction}
      />
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
