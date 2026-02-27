import { useEffect } from "react";

export default function NodeContextMenu({
  open,
  x,
  y,
  node,
  onClose,
  onAction,
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    const onMouseDown = (e) => {
      // Close if clicking outside the menu
      const menuEl = document.getElementById("node-context-menu");
      if (menuEl && !menuEl.contains(e.target)) {
        onClose?.();
      }
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
      id="node-context-menu"
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
        userSelect: "none",
      }}
    >
      {/* <div
        style={itemStyle}
        onClick={() => {
          onAction?.("edit", node);
          onClose?.();
        }}
      >
        Edit Node
      </div> */}

      <div
        style={itemStyle}
        onClick={() => {
          onAction?.("duplicate", node);
          onClose?.();
        }}
      >
        Duplicate
      </div>

      <div style={dividerStyle} />

      <div
        style={{ ...itemStyle, color: "#b91c1c" }}
        onClick={() => {
          onAction?.("delete", node);
          onClose?.();
        }}
      >
        Delete
      </div>
    </div>
  );
}

const itemStyle = {
  padding: "10px 10px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
};

const dividerStyle = {
  height: 1,
  background: "#e2e8f0",
  margin: "6px 0",
};