import { Card, Typography } from 'antd';
import { NODE_LIBRARY } from '../utils/nodeCatalog';

export default function NodePalette() {
  const handleDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card title="Node Palette" bordered className="journey-panel-card">
      <div style={{ display: 'grid', gap: 8 }}>
        {NODE_LIBRARY.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(event) => handleDragStart(event, item.type)}
            className="journey-palette-item"
          >
            <Typography.Text strong>{item.label}</Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {item.type}
            </Typography.Text>
          </div>
        ))}
      </div>
    </Card>
  );
}
