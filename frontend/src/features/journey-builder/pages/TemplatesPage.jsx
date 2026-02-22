import {
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CodeOutlined,
  EditOutlined,
  EyeOutlined,
  LinkOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  useCreateTemplateMutation,
  useGetSchemaContextFieldsQuery,
  useGetSchemaFieldsQuery,
  useGetSchemasQuery,
  useGetTemplatesQuery,
  useUpdateTemplateMutation,
} from '../api/journeyApi';

const CHANNELS = ['email', 'whatsapp', 'sms'];

function getPathValue(obj, path) {
  if (!obj || !path) return '';
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc == null ? '' : acc[key]), obj);
}

function renderPreview(html, sampleContext, fallbackSchema) {
  if (!html) return '';
  return String(html).replace(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g, (_, token) => {
    const parts = String(token).split('.');
    if (parts[0] === 'entity') {
      const key = parts.slice(1).join('.');
      const entity = sampleContext?.[fallbackSchema] || {};
      return String(getPathValue(entity, key) ?? '');
    }
    if (parts.length >= 2) {
      const schemaKey = parts[0];
      const path = parts.slice(1).join('.');
      return String(getPathValue(sampleContext?.[schemaKey] || {}, path) ?? '');
    }
    const entity = sampleContext?.[fallbackSchema] || {};
    return String(getPathValue(entity, token) ?? '');
  });
}

export default function TemplatesPage() {
  const { data, isFetching } = useGetTemplatesQuery();
  const { data: schemasData } = useGetSchemasQuery();
  const [createTemplate, { isLoading }] = useCreateTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateTemplateMutation();

  const [activeChannel, setActiveChannel] = useState('email');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [scopeSchema, setScopeSchema] = useState('lead');
  const [body, setBody] = useState('');

  const [selectedSchemaForVar, setSelectedSchemaForVar] = useState('lead');
  const [selectedFieldForVar, setSelectedFieldForVar] = useState('');

  const bodyRef = useRef(null);

  const templates = data?.templates || [];
  const schemaOptions = (schemasData?.schemas || []).map((s) => ({ label: s.label, value: s.key }));
  const { data: contextFieldsData } = useGetSchemaContextFieldsQuery(scopeSchema || 'lead', {
    skip: !scopeSchema,
  });

  const { data: fieldsData } = useGetSchemaFieldsQuery(selectedSchemaForVar, {
    skip: !selectedSchemaForVar,
  });

  const contextSchemaOptions = (contextFieldsData?.schemas || []).map((s) => ({
    label: s.label,
    value: s.key,
  }));
  const variableSchemaOptions = contextSchemaOptions.length ? contextSchemaOptions : schemaOptions;

  const fieldOptions = (fieldsData?.fields || []).map((f) => ({
    label: f.label,
    value: f.key,
  }));

  const filteredTemplates = useMemo(
    () => templates.filter((template) => template.channel === activeChannel),
    [templates, activeChannel]
  );

  useEffect(() => {
    const allowed = new Set(variableSchemaOptions.map((item) => item.value));
    if (allowed.size && !allowed.has(selectedSchemaForVar)) {
      const first = variableSchemaOptions[0]?.value || scopeSchema || 'lead';
      setSelectedSchemaForVar(first);
      setSelectedFieldForVar('');
    }
  }, [variableSchemaOptions, selectedSchemaForVar, scopeSchema]);

  const sampleContext = {
    lead: {
      firstName: 'TestUser',
      lastName: 'Lead',
      status: 'FL',
      personalEmail: 'lead@example.com',
      mobile: '9999999999',
      createdAt: '2026-02-21',
    },
    customer: {
      firstName: 'TestUser',
      email: 'customer@example.com',
      townCity: 'Dubai',
    },
    account: {
      accountNumber: 'AC123456',
      status: 'ACTIVE',
      accountType: 'Retail',
    },
  };

  const handleReplaceSelectionWithVariable = () => {
    if (!selectedSchemaForVar || !selectedFieldForVar) {
      message.error('Select schema and field first');
      return;
    }

    const textarea = bodyRef.current?.resizableTextArea?.textArea;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? start;
    const variable = `{{${selectedSchemaForVar}.${selectedFieldForVar}}}`;

    const next = `${body.slice(0, start)}${variable}${body.slice(end)}`;
    setBody(next);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + variable.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleCreateTemplate = async () => {
    if (!name || !body) {
      message.error('Template name and body are required');
      return;
    }

    try {
      const payload = {
        name,
        channel: activeChannel || 'email',
        type: 'custom',
        scopeSchema,
        subject,
        contentType: 'html',
        body,
      };

      if (modalMode === 'edit' && editingTemplateId) {
        await updateTemplate({ id: editingTemplateId, ...payload }).unwrap();
        message.success('Template updated');
      } else {
        await createTemplate(payload).unwrap();
        message.success('Template created');
      }

      setIsModalOpen(false);
      setModalMode('create');
      setEditingTemplateId(null);
      setName('');
      setSubject('');
      setScopeSchema('lead');
      setBody('');
      setSelectedSchemaForVar('lead');
      setSelectedFieldForVar('');
    } catch (error) {
      message.error(error?.data?.message || 'Failed to create template');
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Card className="journey-panel-card">
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>Template Studio</Typography.Title>
              <Typography.Text type="secondary">Create dynamic email templates with live preview</Typography.Text>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => {
                setModalMode('create');
                setEditingTemplateId(null);
                setName('');
                setSubject('');
                setScopeSchema('lead');
                setBody('');
                setSelectedSchemaForVar('lead');
                setSelectedFieldForVar('');
                setIsModalOpen(true);
              }}
            >
              New Template
            </Button>
          </Space>
        </Card>
      </Col>

      <Col xs={24}>
        <Card title="Template Library">
          <Tabs
            activeKey={activeChannel}
            onChange={setActiveChannel}
            items={CHANNELS.map((channel) => ({
              key: channel,
              label: channel.toUpperCase(),
              children: (
                <Table
                  rowKey="_id"
                  loading={isFetching}
                  dataSource={filteredTemplates}
                  pagination={{ pageSize: 6 }}
                  columns={[
                    { title: 'Name', dataIndex: 'name', key: 'name' },
                    { title: 'Schema', dataIndex: 'scopeSchema', key: 'scopeSchema' },
                    { title: 'Subject', dataIndex: 'subject', key: 'subject' },
                    { title: 'Type', dataIndex: 'type', key: 'type' },
                    {
                      title: 'Body',
                      dataIndex: 'body',
                      key: 'body',
                      render: (value) => (value || '').replace(/<[^>]*>/g, '').slice(0, 120),
                    },
                    {
                      title: 'Action',
                      key: 'action',
                      render: (_, record) => (
                        <Space>
                          <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewTemplate(record)}>
                            View
                          </Button>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setModalMode('edit');
                              setEditingTemplateId(record._id);
                              setName(record.name || '');
                              setSubject(record.subject || '');
                              setScopeSchema(record.scopeSchema || 'lead');
                              setBody(record.body || '');
                              setSelectedSchemaForVar(record.scopeSchema || 'lead');
                              setSelectedFieldForVar('');
                              setIsModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              ),
            }))}
          />
        </Card>
      </Col>

      <Modal
        title={previewTemplate ? `Template Preview: ${previewTemplate.name}` : 'Template Preview'}
        open={Boolean(previewTemplate)}
        footer={null}
        onCancel={() => setPreviewTemplate(null)}
        width={900}
      >
        <Typography.Paragraph style={{ marginBottom: 8 }}>
          <strong>Channel:</strong> {previewTemplate?.channel || '-'}
        </Typography.Paragraph>
        <Typography.Paragraph style={{ marginBottom: 8 }}>
          <strong>Subject:</strong> {previewTemplate?.subject || '-'}
        </Typography.Paragraph>
        <div
          style={{
            border: '1px solid #e4e6eb',
            borderRadius: 10,
            padding: 12,
            minHeight: 280,
            background: '#fff',
          }}
          dangerouslySetInnerHTML={{ __html: previewTemplate?.body || '' }}
        />
      </Modal>

      <Modal
        title={modalMode === 'edit' ? 'Edit Template' : 'Create Template'}
        rootClassName="cf-template-modal"
        open={isModalOpen}
        onOk={handleCreateTemplate}
        onCancel={() => setIsModalOpen(false)}
        okText={modalMode === 'edit' ? 'Update Template' : 'Save Template'}
        confirmLoading={isLoading || isUpdating}
        width={1200}
      >
        <div className="template-studio-banner">
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Dynamic Email Studio
            </Typography.Title>
            <Typography.Text type="secondary">
              Build reusable templates with linked schema placeholders.
            </Typography.Text>
          </div>
          <Space wrap>
            {variableSchemaOptions.map((schema) => (
              <span key={schema.value} className="template-chip">
                <LinkOutlined /> {schema.label}
              </span>
            ))}
          </Space>
        </div>

        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card className="template-pane-card" title="Template Setup">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Typography.Text type="secondary">Template Name</Typography.Text>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <Typography.Text type="secondary">Scope Schema</Typography.Text>
                <Select
                  style={{ width: '100%' }}
                  value={scopeSchema || 'lead'}
                  options={schemaOptions}
                  onChange={(value) => {
                    setScopeSchema(value);
                    setSelectedSchemaForVar(value);
                    setSelectedFieldForVar('');
                  }}
                />
              </div>

              <div>
                <Typography.Text type="secondary">Subject</Typography.Text>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Welcome {{lead.firstName}}"
                />
              </div>

              <Card size="small" title="Dynamic Variable Replace">
                <Space wrap>
                  <Select
                    style={{ width: 150 }}
                    value={selectedSchemaForVar}
                    options={variableSchemaOptions}
                    onChange={(value) => {
                      setSelectedSchemaForVar(value);
                      setSelectedFieldForVar('');
                    }}
                  />
                  <Select
                    style={{ width: 220 }}
                    value={selectedFieldForVar || undefined}
                    options={fieldOptions}
                    placeholder="Select field"
                    onChange={setSelectedFieldForVar}
                  />
                  <Button icon={<CodeOutlined />} onClick={handleReplaceSelectionWithVariable}>
                    Replace Selected Text
                  </Button>
                </Space>
                <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                  Highlight text in the editor and replace with a dynamic variable.
                </Typography.Paragraph>
                <Typography.Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                  Example: <code>{'{{lead.firstName}}'}</code> and <code>{'{{account.accountNumber}}'}</code>
                </Typography.Paragraph>
              </Card>

              <div>
                <Typography.Text type="secondary">HTML Body</Typography.Text>
                <Input.TextArea
                  ref={bodyRef}
                  rows={14}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="<p>Hi TestUser,</p><p>Welcome...</p>"
                />
              </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card className="template-pane-card" size="small" title="Live Preview">
              <Typography.Paragraph style={{ marginBottom: 6 }}>
                <strong>Subject:</strong> {renderPreview(subject || '', sampleContext, scopeSchema || 'lead')}
              </Typography.Paragraph>
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: 12,
                  minHeight: 320,
                  background: '#fff',
                }}
                dangerouslySetInnerHTML={{
                  __html: renderPreview(body || '', sampleContext, scopeSchema || 'lead'),
                }}
              />
            </Card>
            <div style={{ marginTop: 10 }}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleCreateTemplate}
                loading={isLoading || isUpdating}
              >
                {modalMode === 'edit' ? 'Update Template' : 'Save Template'}
              </Button>
            </div>
          </Col>
        </Row>
      </Modal>
    </Row>
  );
}
