import { Handle, Position } from "@xyflow/react";
import clsx from "clsx";
import { getNodeMeta } from "../utils/nodeCatalog"; // make sure path is correct
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  BranchesOutlined,
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
const NODE_ICONS = {
  "trigger.event": <ThunderboltOutlined />,
  "wait.timer": <ClockCircleOutlined />,
  "condition.check": <BranchesOutlined />,
  "action.send.message": <MailOutlined />,
  "end.success": <CheckCircleOutlined />,
  "end.discard": <CloseCircleOutlined />,
};
const NODE_COLORS = {
  "trigger.event": "#0ea5e9",
  "wait.timer": "#6366f1",
  "condition.check": "#f59e0b",
  "action.send.message": "#10b981",
  "end.success": "#22c55e",
  "end.discard": "#ef4444",
};
const NODE_PASTEL_BACKGROUNDS = {
  "trigger.event": "#effbff",
  "wait.timer": "#f3f4ff",
  "condition.check": "#fff8ec",
  "action.send.message": "#ecfdf6",
  "end.success": "#eefdf3",
  "end.discard": "#fff1f2",
};
const NODE_PASTEL_BORDERS = {
  "trigger.event": "#bfefff",
  "wait.timer": "#cfd3ff",
  "condition.check": "#ffe5b8",
  "action.send.message": "#bdeedb",
  "end.success": "#c8f2d5",
  "end.discard": "#ffcdd2",
};

export default function JourneyFlowNode(props) {
  const { data, selected } = props;

  // ✅ This is your real node type (business type)
  const businessType = data?.nodeType || "node";

  // ✅ Pull label/description from catalog
  const meta = getNodeMeta(businessType);

  const Icon = NODE_ICONS[businessType];
  // ✅ Choose color
  const color = NODE_COLORS[businessType] || "#64748b";
  const bgColor = NODE_PASTEL_BACKGROUNDS[businessType] || "#f8fafc";
  const borderColor = NODE_PASTEL_BORDERS[businessType] || "#e2e8f0";

  return (
    <div
      className={clsx(
        "journey-node-card",
        selected && "journey-node-card-selected",
      )}
      style={{
        "--node-accent": color,
        "--node-bg": bgColor,
        "--node-border": borderColor,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: color }}
      />

      <div className="journey-node-title" style={{gap:"5px", display:"flex", alignItems:"center"}}>
        {Icon && (
          <span className="node-icon" style={{ color }}>
            {Icon}
          </span>
        )}
        <span>{data?.label || meta?.label}</span>
      </div>

      <div className="journey-node-type">
        {data?.description || meta?.description || "—"}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: color }}
      />
    </div>
  );
}
