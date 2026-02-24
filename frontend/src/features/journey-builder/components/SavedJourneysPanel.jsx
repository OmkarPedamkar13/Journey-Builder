import { Button, Card, Popconfirm, Space, Table, Tag } from 'antd';
import { useDispatch } from 'react-redux';
import { CloudUploadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { loadJourneyGraph, setJourneyName } from '../slice/journeyBuilderSlice';

export default function SavedJourneysPanel({
  journeys = [],
  onPublish,
  onDelete,
  onLoadJourney,
  loading = false,
}) {
  const dispatch = useDispatch();

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Schema',
      dataIndex: 'triggerSchema',
      key: 'triggerSchema',
      render: (value) => value || 'lead',
    },
    {
      title: 'Event',
      dataIndex: 'triggerEvent',
      key: 'triggerEvent',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value) => <Tag color={value === 'published' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value) => (value ? new Date(value).toLocaleString() : '-'),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              dispatch(setJourneyName(record.name || 'Journey'));
              dispatch(loadJourneyGraph(record));
              if (onLoadJourney) onLoadJourney(record);
            }}
          >
            Load & Edit
          </Button>
          {record.status !== 'published' ? (
            <Button size="small" type="primary" icon={<CloudUploadOutlined />} onClick={() => onPublish(record._id)}>
              Publish
            </Button>
          ) : null}
          <Popconfirm
            title="Delete this journey?"
            description="This action cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete?.(record._id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Saved Journeys" bordered>
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={journeys}
        loading={loading}
        size="small"
        pagination={{ pageSize: 5 }}
      />
    </Card>
  );
}
