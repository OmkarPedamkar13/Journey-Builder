import { Button, Col, Row, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import EventTriggerForm from '../components/EventTriggerForm';
import SavedJourneysPanel from '../components/SavedJourneysPanel';
import {
  useDeleteJourneyMutation,
  useGetJourneysQuery,
  usePublishJourneyMutation,
} from '../api/journeyApi';

export default function JourneyListPage({ onCreateJourney, onOpenJourney }) {
  const { data, isFetching } = useGetJourneysQuery();
  const [publishJourney] = usePublishJourneyMutation();
  const [deleteJourney] = useDeleteJourneyMutation();

  const handlePublishJourney = async (journeyId) => {
    try {
      await publishJourney(journeyId).unwrap();
      message.success('Journey published');
    } catch (error) {
      message.error(error?.data?.message || 'Failed to publish journey');
    }
  };

  const handleDeleteJourney = async (journeyId) => {
    try {
      await deleteJourney(journeyId).unwrap();
      message.success('Journey deleted');
    } catch (error) {
      message.error(error?.data?.message || 'Failed to delete journey');
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreateJourney}>
          Create Journey
        </Button>
      </Col>

      <Col xs={24}>
        <SavedJourneysPanel
          journeys={data?.journeys || []}
          onPublish={handlePublishJourney}
          onDelete={handleDeleteJourney}
          onLoadJourney={onOpenJourney}
          loading={isFetching}
        />
      </Col>

      <Col xs={24}>
        <EventTriggerForm />
      </Col>
    </Row>
  );
}
