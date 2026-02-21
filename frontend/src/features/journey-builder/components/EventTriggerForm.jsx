import { Button, Card, Form, Input, Select, Space, Typography, message } from 'antd';
import { useState } from 'react';
import { useGetSchemasQuery, useTriggerJourneyEventMutation } from '../api/journeyApi';

const eventOptions = [
  { label: 'Created', value: 'created' },
  { label: 'Updated', value: 'updated' },
];

const defaultCurrentPayload = {
  leadId: `lead_${Date.now()}`,
  firstName: 'Test',
  status: 'CL',
  personalEmail: 'test@example.com',
};

const defaultPreviousPayload = {
  leadId: 'lead_123',
  firstName: 'Test',
  status: 'CL',
};

export default function EventTriggerForm() {
  const [form] = Form.useForm();
  const [lastResult, setLastResult] = useState(null);
  const { data: schemaData } = useGetSchemasQuery();
  const [triggerJourneyEvent, { isLoading }] = useTriggerJourneyEventMutation();

  const schemaOptions = (schemaData?.schemas || []).map((item) => ({
    label: item.label,
    value: item.key,
  }));

  const onFinish = async (values) => {
    try {
      const current = JSON.parse(values.currentJson || '{}');
      const previous = values.previousJson ? JSON.parse(values.previousJson) : {};

      const result = await triggerJourneyEvent({
        schema: values.schema,
        event: values.event,
        current,
        previous,
        includeDraft: values.includeDraft,
      }).unwrap();

      setLastResult(result);
      message.success(`Queued ${result.total || 0} execution(s)`);
    } catch (error) {
      const parseError = error instanceof SyntaxError ? 'Invalid JSON payload' : null;
      message.error(parseError || error?.data?.message || 'Failed to trigger event');
    }
  };

  return (
    <Card title="Trigger Journey Event" bordered>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          schema: 'lead',
          event: 'created',
          includeDraft: true,
          currentJson: JSON.stringify(defaultCurrentPayload, null, 2),
          previousJson: JSON.stringify(defaultPreviousPayload, null, 2),
        }}
      >
        <Form.Item label="Schema" name="schema" rules={[{ required: true }]}>
          <Select options={schemaOptions} />
        </Form.Item>

        <Form.Item label="Event" name="event" rules={[{ required: true }]}>
          <Select options={eventOptions} />
        </Form.Item>

        <Form.Item label="Current Payload (JSON)" name="currentJson" rules={[{ required: true }]}>
          <Input.TextArea rows={8} />
        </Form.Item>

        <Form.Item label="Previous Payload (JSON) - for updated events" name="previousJson">
          <Input.TextArea rows={6} />
        </Form.Item>

        <Form.Item label="Include Draft Journeys" name="includeDraft">
          <Select
            options={[
              { label: 'Yes', value: true },
              { label: 'No (published only)', value: false },
            ]}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Trigger Event
            </Button>
            <Button onClick={() => form.resetFields()}>Reset</Button>
          </Space>
        </Form.Item>
      </Form>

      {lastResult ? (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Enqueued <strong>{lastResult.total || 0}</strong> execution(s).
        </Typography.Paragraph>
      ) : null}
    </Card>
  );
}
