import { Handle, Position } from '@xyflow/react';
import clsx from 'clsx';

const NODE_COLORS = {
  'trigger.event': '#0ea5e9',
  'wait.timer': '#6366f1',
  'condition.check': '#f59e0b',
  'action.send.message': '#10b981',
  'end.success': '#22c55e',
  'end.discard': '#ef4444',
};

export default function JourneyFlowNode({ data, selected }) {
  const nodeType = data?.nodeType || 'node';
  const color = NODE_COLORS[nodeType] || '#64748b';

  return (
    <div
      className={clsx('journey-node-card', selected && 'journey-node-card-selected')}
      style={{ '--node-accent': color }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <div className="journey-node-title">{data?.label || nodeType}</div>
      <div className="journey-node-type">{nodeType}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </div>
  );
}
