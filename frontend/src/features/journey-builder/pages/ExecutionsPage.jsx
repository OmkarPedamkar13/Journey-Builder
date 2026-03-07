import { Card, Col, Row, Table, Tag } from 'antd';
import { useMemo } from 'react';
import { useGetExecutionsQuery } from '../api/journeyApi';

function renderStatus(status) {
  if (status === 'completed') return <Tag color="green">completed</Tag>;
  if (status === 'failed') return <Tag color="red">failed</Tag>;
  if (status === 'discarded') return <Tag color="orange">discarded</Tag>;
  if (status === 'queued') return <Tag color="blue">queued</Tag>;
  if (status === 'started') return <Tag color="purple">started</Tag>;
  return <Tag>{status || '-'}</Tag>;
}

export default function ExecutionsPage({ onOpenExecution }) {
  const { data, isFetching } = useGetExecutionsQuery();

  const executions = data?.executions || [];

  const columns = useMemo(
    () => [
      {
        title: 'Journey',
        key: 'journey',
        render: (_, record) => record?.journeyId?.name || '-',
      },
      {
        title: 'Entity',
        key: 'entity',
        render: (_, record) => `${record?.entitySchema || '-'} : ${record?.entityId || '-'}`,
      },
      {
        title: 'Trigger',
        key: 'trigger',
        render: (_, record) => `${record?.entitySchema || '-'} . ${record?.triggerEvent || '-'}`,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (value) => renderStatus(value),
      },
      {
        title: 'Updated',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        render: (value) => (value ? new Date(value).toLocaleString() : '-'),
      },
    ],
    []
  );

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Card title="Journey Executions" className="journey-panel-card">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={executions}
            loading={isFetching}
            pagination={{ pageSize: 12 }}
            onRow={(record) => ({
              onClick: () => onOpenExecution?.(record._id),
              style: {
                cursor: 'pointer',
              },
            })}
          />
        </Card>
      </Col>
    </Row>
  );
}
