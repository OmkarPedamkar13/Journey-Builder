import { Button, Card, Col, Input, Row, Space, Typography, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import EventTriggerForm from '../components/EventTriggerForm';
import FlowCanvas from '../components/FlowCanvas';
import NodeConfigPanel from '../components/NodeConfigPanel';
import NodePalette from '../components/NodePalette';
import SavedJourneysPanel from '../components/SavedJourneysPanel';
import {
  removeSelectedNode,
  resetJourneyGraph,
  setJourneyName,
} from '../slice/journeyBuilderSlice';
import {
  useCreateJourneyMutation,
  useGetJourneysQuery,
  usePublishJourneyMutation,
} from '../api/journeyApi';
import { validateJourneyGraph } from '../utils/graphValidation';
import { extractTriggerEvent, extractTriggerSchema } from '../utils/workflow';

export default function JourneyBuilderPage() {
  const dispatch = useDispatch();
  const { name, nodes, edges } = useSelector((state) => state.journeyBuilder);

  const { data, isFetching } = useGetJourneysQuery();
  const [createJourney, { isLoading }] = useCreateJourneyMutation();
  const [publishJourney] = usePublishJourneyMutation();

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

  const handlePublishJourney = async (journeyId) => {
    try {
      await publishJourney(journeyId).unwrap();
      message.success('Journey published');
    } catch (error) {
      message.error(error?.data?.message || 'Failed to publish journey');
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Card>
          <Space wrap>
            <Input
              style={{ width: 300 }}
              value={name}
              onChange={(e) => dispatch(setJourneyName(e.target.value))}
              placeholder="Journey name"
            />
            <Button type="primary" loading={isLoading} onClick={handleSaveJourney}>
              Save Draft
            </Button>
            <Button onClick={() => dispatch(removeSelectedNode())}>Delete Selected Node</Button>
            <Button onClick={() => dispatch(resetJourneyGraph())}>New Blank Journey</Button>
          </Space>
          <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            Start with a blank canvas. Drag Trigger/Condition/Action nodes from palette, connect them,
            configure each node, then save. Condition nodes require both Yes and No branches.
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

      <Col xs={24}>
        <EventTriggerForm />
      </Col>

      <Col xs={24}>
        <SavedJourneysPanel
          journeys={data?.journeys || []}
          onPublish={handlePublishJourney}
          loading={isFetching}
        />
      </Col>
    </Row>
  );
}
