import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, Row, Space, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import { useGetExecutionByIdQuery } from '../api/journeyApi';
import ExecutionFlowViewer from '../components/ExecutionFlowViewer';

function renderStatus(status) {
  if (status === 'completed') return <Tag color="green">completed</Tag>;
  if (status === 'failed') return <Tag color="red">failed</Tag>;
  if (status === 'discarded') return <Tag color="orange">discarded</Tag>;
  if (status === 'queued') return <Tag color="blue">queued</Tag>;
  if (status === 'started') return <Tag color="purple">started</Tag>;
  return <Tag>{status || '-'}</Tag>;
}

export default function ExecutionDetailPage({ executionId, onBack }) {
  const { data, isFetching } = useGetExecutionByIdQuery(executionId, { skip: !executionId });
  const execution = data?.execution || null;
  const relatedExecutions = data?.relatedExecutions || [];
  const journey = execution?.journeyId || null;
  const allExecutions = useMemo(() => {
    const map = new Map();
    [...relatedExecutions, execution].filter(Boolean).forEach((item) => {
      map.set(String(item._id), item);
    });
    return Array.from(map.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [execution, relatedExecutions]);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            Back to Execution Logs
          </Button>
          {execution ? (
            <>
              <Typography.Text>
                <strong>Journey:</strong> {journey?.name || '-'}
              </Typography.Text>
              <Typography.Text>
                <strong>Status:</strong> {renderStatus(execution.status)}
              </Typography.Text>
              <Typography.Text>
                <strong>Execution ID:</strong> {execution._id}
              </Typography.Text>
            </>
          ) : null}
        </Space>
      </Col>

      <Col xs={24}>
        <Card title="Execution Path" className="journey-panel-card" loading={isFetching}>
          {!execution ? (
            <Empty description="Execution not found" />
          ) : journey?.graph ? (
            <ExecutionFlowViewer
              graph={journey.graph}
              executions={allExecutions}
            />
          ) : (
            <Empty description="Journey graph unavailable for this execution" />
          )}
        </Card>
      </Col>

      <Col xs={24}>
        <Card title="Execution Logs" className="journey-panel-card" loading={isFetching}>
          {!execution?.logs?.length ? (
            <Empty description="No logs available" />
          ) : (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {execution.logs.map((log, index) => (
                <Typography.Text key={`${execution._id}_log_${index}`}>
                  [{index + 1}] {log.step || '-'} {log.nodeId ? `(${log.nodeId})` : ''} {log.ok === false ? 'failed' : 'ok'}
                </Typography.Text>
              ))}
            </Space>
          )}
        </Card>
      </Col>
    </Row>
  );
}
