import { Button, Card, Col, Input, Row, Space, Typography, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import FlowCanvas from '../components/FlowCanvas';
import NodeConfigPanel from '../components/NodeConfigPanel';
import NodePalette from '../components/NodePalette';
import {
  createNewJourney,
  removeSelectedEdge,
  removeSelectedNode,
  resetJourneyGraph,
  setCurrentJourneyId,
  setJourneyName,
} from '../slice/journeyBuilderSlice';
import { useCreateJourneyMutation, useUpdateJourneyMutation } from '../api/journeyApi';
import { validateJourneyGraph } from '../utils/graphValidation';
import { extractTriggerEvent, extractTriggerSchema } from '../utils/workflow';

export default function JourneyCreatePage({ onBack }) {
  const dispatch = useDispatch();
  const { currentJourneyId, name, nodes, edges, selectedNodeId, selectedEdgeId } = useSelector(
    (state) => state.journeyBuilder
  );

  const [createJourney, { isLoading }] = useCreateJourneyMutation();
  const [updateJourney, { isLoading: isUpdating }] = useUpdateJourneyMutation();

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
      const payload = { name, triggerSchema, triggerEvent, graph };

      if (currentJourneyId) {
        await updateJourney({ id: currentJourneyId, ...payload }).unwrap();
        message.success('Journey updated');
      } else {
        const response = await createJourney(payload).unwrap();
        dispatch(setCurrentJourneyId(response?.journey?._id || null));
        message.success('Journey saved as draft');
      }

      onBack?.();
    } catch (error) {
      message.error(error?.data?.message || 'Failed to save journey');
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Card>
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
              Back to Journey List
            </Button>
            <Input
              style={{ width: 300 }}
              value={name}
              onChange={(e) => dispatch(setJourneyName(e.target.value))}
              placeholder="Journey name"
            />
            <Button
              type="primary"
              icon={currentJourneyId ? <EditOutlined /> : <SaveOutlined />}
              loading={isLoading || isUpdating}
              onClick={handleSaveJourney}
            >
              Save Draft
            </Button>
            <Button icon={<DeleteOutlined />} disabled={!selectedNodeId} onClick={() => dispatch(removeSelectedNode())}>
              Delete Node
            </Button>
            <Button icon={<DeleteOutlined />} disabled={!selectedEdgeId} onClick={() => dispatch(removeSelectedEdge())}>
              Delete Edge
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => dispatch(resetJourneyGraph())}>
              Reset Graph
            </Button>
            <Button icon={<PlusCircleOutlined />} onClick={() => dispatch(createNewJourney())}>
              New Journey
            </Button>
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
