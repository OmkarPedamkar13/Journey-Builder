import { Button, Card, Col, Input, Row, Space, Typography, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import FlowCanvas from '../components/FlowCanvas';
import NodeConfigPanel from '../components/NodeConfigPanel';
import NodePalette from '../components/NodePalette';
import {
  createNewJourney,
  removeSelectedEdge,
  removeSelectedNode,
  resetJourneyGraph,
  setJourneyName,
} from '../slice/journeyBuilderSlice';
import { useCreateJourneyMutation } from '../api/journeyApi';
import { validateJourneyGraph } from '../utils/graphValidation';
import { extractTriggerEvent, extractTriggerSchema } from '../utils/workflow';

export default function JourneyCreatePage({ onBack }) {
  const dispatch = useDispatch();
  const { name, nodes, edges, selectedNodeId, selectedEdgeId } = useSelector((state) => state.journeyBuilder);

  const [createJourney, { isLoading }] = useCreateJourneyMutation();

  const handleSaveJourney = async () => {
    const validation = validateJourneyGraph(nodes, edges);
    if (!validation.valid) {
      message.error(validation.errors[0]);
      return;
    }

    try {
      const graph = { nodes, edges, settings: {} };
      const triggerEvent = extractTriggerEvent(nodes);
      const triggerSchema = extractTriggerSchema(nodes);

      await createJourney({
        name,
        triggerSchema,
        triggerEvent,
        graph,
      }).unwrap();

      message.success('Journey saved as draft');
    } catch (error) {
      message.error(error?.data?.message || 'Failed to save journey');
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Card>
          <Space wrap>
            <Button onClick={onBack}>Back to Journey List</Button>
            <Input
              style={{ width: 300 }}
              value={name}
              onChange={(e) => dispatch(setJourneyName(e.target.value))}
              placeholder="Journey name"
            />
            <Button type="primary" loading={isLoading} onClick={handleSaveJourney}>
              Save Draft
            </Button>
            <Button disabled={!selectedNodeId} onClick={() => dispatch(removeSelectedNode())}>
              Delete Node
            </Button>
            <Button disabled={!selectedEdgeId} onClick={() => dispatch(removeSelectedEdge())}>
              Delete Edge
            </Button>
            <Button onClick={() => dispatch(resetJourneyGraph())}>Reset Graph</Button>
            <Button onClick={() => dispatch(createNewJourney())}>New Journey</Button>
          </Space>
          <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            Drag nodes from palette, connect them, then configure selected node in the right panel.
            Click an edge to select and delete it.
          </Typography.Paragraph>
        </Card>
      </Col>

      <Col xs={24} lg={5}>
        <NodePalette />
      </Col>

      <Col xs={24} lg={13}>
        <FlowCanvas />
      </Col>

      <Col xs={24} lg={6}>
        <NodeConfigPanel />
      </Col>
    </Row>
  );
}
