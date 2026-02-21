import { Button, Col, Row, message } from 'antd';
import EventTriggerForm from '../components/EventTriggerForm';
import SavedJourneysPanel from '../components/SavedJourneysPanel';
import { useGetJourneysQuery, usePublishJourneyMutation } from '../api/journeyApi';

export default function JourneyListPage({ onCreateJourney, onOpenJourney }) {
  const { data, isFetching } = useGetJourneysQuery();
  const [publishJourney] = usePublishJourneyMutation();

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
        <Button type="primary" onClick={onCreateJourney}>Create Journey</Button>
      </Col>

      <Col xs={24}>
        <SavedJourneysPanel
          journeys={data?.journeys || []}
          onPublish={handlePublishJourney}
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
