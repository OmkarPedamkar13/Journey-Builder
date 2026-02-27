import { useEffect } from "react";

export default function EdgeContextMenu({ open, x, y, edge, onClose, onAction }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => e.key === "Escape" && onClose?.();
    const onMouseDown = (e) => {
      const el = document.getElementById("edge-context-menu");
      if (el && !el.contains(e.target)) onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      id="edge-context-menu"
      style={{
        position: "fixed",
        top: y,
        left: x,
        zIndex: 9999,
        minWidth: 180,
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        boxShadow: "0 10px 30px rgba(2, 6, 23, 0.15)",
        padding: 6,
      }}
    >
      <div
        style={itemStyle}
        onClick={() => {
          onAction?.("delete", edge);
          onClose?.();
        }}
      >
        Delete Edge
      </div>
    </div>
  );
}

const itemStyle = {
  padding: "10px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
};