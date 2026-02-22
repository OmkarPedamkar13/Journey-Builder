import { Button, Card, Input, Select, Space, Typography } from 'antd';
import {
  DeleteOutlined,
  PlusCircleOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  useGetSchemaFieldsQuery,
  useGetSchemasQuery,
  useGetTemplatesQuery,
} from '../api/journeyApi';
import { updateNodeConfig } from '../slice/journeyBuilderSlice';
import { NODE_TYPES } from '../utils/nodeCatalog';

const channelOptions = [
  { label: 'Email', value: 'email' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'SMS', value: 'sms' },
];

const waitUnitOptions = [
  { label: 'Seconds', value: 'seconds' },
  { label: 'Minutes', value: 'minutes' },
  { label: 'Hours', value: 'hours' },
  { label: 'Days', value: 'days' },
  { label: 'Months', value: 'months' },
  { label: 'Years', value: 'years' },
];

function stripHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ');
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function createConditionRule(initial = {}) {
  return {
    id: uid('rule'),
    kind: 'rule',
    ruleType: initial.ruleType || initial.conditionType || 'exists',
    field: initial.field || '',
    value: initial.value || '',
    from: initial.from || '',
    to: initial.to || '',
  };
}

function createConditionGroup(operator = 'and', items = []) {
  return {
    id: uid('group'),
    kind: 'group',
    operator,
    items,
  };
}

function normalizeConditionGroup(config) {
  if (config?.conditionGroup && Array.isArray(config.conditionGroup.items)) {
    return config.conditionGroup;
  }

  return createConditionGroup('and', [createConditionRule(config || {})]);
}

function updateGroupById(group, groupId, updater) {
  if (!group) return group;
  if (group.id === groupId) return updater(group);

  const nextItems = (group.items || []).map((item) => {
    if (item?.kind === 'group') return updateGroupById(item, groupId, updater);
    return item;
  });

  return { ...group, items: nextItems };
}

function updateRuleById(group, ruleId, updater) {
  if (!group) return group;
  const nextItems = (group.items || []).map((item) => {
    if (item?.kind === 'group') return updateRuleById(item, ruleId, updater);
    if (item?.id === ruleId) return updater(item);
    return item;
  });
  return { ...group, items: nextItems };
}

function removeItemById(group, itemId) {
  if (!group) return group;
  const nextItems = (group.items || [])
    .filter((item) => item?.id !== itemId)
    .map((item) => (item?.kind === 'group' ? removeItemById(item, itemId) : item));
  return { ...group, items: nextItems };
}

export default function NodeConfigPanel() {
  const dispatch = useDispatch();
  const { nodes, selectedNodeId } = useSelector((state) => state.journeyBuilder);
  const node = nodes.find((item) => item.id === selectedNodeId);

  const config = node?.config || {};
  const schemaKey = config.schema || 'lead';

  const { data: schemasData } = useGetSchemasQuery();
  const { data: schemaFieldsData } = useGetSchemaFieldsQuery(schemaKey, {
    skip: !schemaKey,
  });
  const { data: templatesData } = useGetTemplatesQuery();

  const templates = templatesData?.templates || [];
  const emailTemplates = templates.filter((t) => t.channel === 'email');
  const selectedTemplate = emailTemplates.find((t) => t._id === config.templateId);

  const schemaOptions = (schemasData?.schemas || []).map((schema) => ({
    label: schema.label,
    value: schema.key,
  }));

  const fieldOptions = (schemaFieldsData?.fields || []).map((field) => ({
    label: field.label,
    value: field.key,
  }));
  const conditionGroup = normalizeConditionGroup(config);

  if (!node) {
    return <Card title="Node Config">Select a node</Card>;
  }

  const nodeType = node.data?.nodeType;

  const patch = (next) => {
    dispatch(updateNodeConfig({ nodeId: node.id, patch: next }));
  };

  const renderValueInput = (value, onChange, placeholder) => {
    return <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
  };

  const patchConditionGroup = (nextGroup) => {
    patch({ conditionGroup: nextGroup });
  };

  const addRuleToGroup = (groupId) => {
    const next = updateGroupById(conditionGroup, groupId, (group) => ({
      ...group,
      items: [...(group.items || []), createConditionRule()],
    }));
    patchConditionGroup(next);
  };

  const addNestedGroup = (groupId) => {
    const next = updateGroupById(conditionGroup, groupId, (group) => ({
      ...group,
      items: [...(group.items || []), createConditionGroup('and', [createConditionRule()])],
    }));
    patchConditionGroup(next);
  };

  const renderConditionRule = (rule) => (
    <Card key={rule.id} size="small" style={{ border: '1px solid #e4e6eb' }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space wrap>
          <Select
            style={{ width: 140 }}
            value={rule.ruleType || 'exists'}
            options={[
              { label: 'Exists', value: 'exists' },
              { label: 'Field Equals', value: 'equals' },
              { label: 'Field Changed', value: 'changed' },
            ]}
            onChange={(value) => {
              const next = updateRuleById(conditionGroup, rule.id, (item) => ({
                ...item,
                ruleType: value,
              }));
              patchConditionGroup(next);
            }}
          />
          <Select
            style={{ width: 190 }}
            value={rule.field || undefined}
            options={fieldOptions}
            placeholder="Select field"
            onChange={(value) => {
              const next = updateRuleById(conditionGroup, rule.id, (item) => ({
                ...item,
                field: value,
              }));
              patchConditionGroup(next);
            }}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              const next = removeItemById(conditionGroup, rule.id);
              patchConditionGroup(next);
            }}
          >
            Remove
          </Button>
        </Space>

        {(rule.ruleType || 'exists') === 'equals' ? (
          renderValueInput(
            rule.value || '',
            (value) => {
              const next = updateRuleById(conditionGroup, rule.id, (item) => ({ ...item, value }));
              patchConditionGroup(next);
            },
            'Expected value'
          )
        ) : null}

        {(rule.ruleType || 'exists') === 'changed' ? (
          <Space wrap style={{ width: '100%' }}>
            {renderValueInput(
              rule.from || '',
              (value) => {
                const next = updateRuleById(conditionGroup, rule.id, (item) => ({ ...item, from: value }));
                patchConditionGroup(next);
              },
              'From value (optional)'
            )}
            {renderValueInput(
              rule.to || '',
              (value) => {
                const next = updateRuleById(conditionGroup, rule.id, (item) => ({ ...item, to: value }));
                patchConditionGroup(next);
              },
              'To value (optional)'
            )}
          </Space>
        ) : null}
      </Space>
    </Card>
  );

  const renderConditionGroup = (group, isRoot = false) => (
    <Card
      key={group.id}
      size="small"
      style={{
        border: '1px solid #e4e6eb',
        background: isRoot ? '#fffdf5' : '#ffffff',
      }}
      title={isRoot ? 'Condition Group' : 'Nested Group'}
      extra={
        isRoot ? null : (
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              const next = removeItemById(conditionGroup, group.id);
              patchConditionGroup(next);
            }}
          >
            Remove Group
          </Button>
        )
      }
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div>
          <Typography.Text type="secondary">Operator</Typography.Text>
          <Select
            style={{ width: '100%' }}
            value={group.operator || 'and'}
            options={[
              { label: 'AND ($and)', value: 'and' },
              { label: 'OR ($or)', value: 'or' },
            ]}
            onChange={(value) => {
              const next = updateGroupById(conditionGroup, group.id, (item) => ({
                ...item,
                operator: value,
              }));
              patchConditionGroup(next);
            }}
          />
        </div>

        {(group.items || []).map((item) =>
          item?.kind === 'group'
            ? renderConditionGroup(item, false)
            : renderConditionRule(item)
        )}

        <Space wrap>
          <Button size="small" icon={<PlusCircleOutlined />} onClick={() => addRuleToGroup(group.id)}>
            Add Condition
          </Button>
          <Button size="small" icon={<NodeIndexOutlined />} onClick={() => addNestedGroup(group.id)}>
            Add Group
          </Button>
        </Space>
      </Space>
    </Card>
  );

  return (
    <Card title="Node Config" bordered className="journey-panel-card">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Typography.Text type="secondary">Type</Typography.Text>
          <div>{nodeType}</div>
        </div>

        {nodeType === NODE_TYPES.TRIGGER_EVENT ? (
          <>
            <div>
              <Typography.Text type="secondary">Schema</Typography.Text>
              <Select
                style={{ width: '100%' }}
                value={schemaKey}
                options={schemaOptions}
                onChange={(value) => patch({ schema: value, field: undefined })}
              />
            </div>

            <div>
              <Typography.Text type="secondary">Event</Typography.Text>
              <Select
                style={{ width: '100%' }}
                value={config.event || 'created'}
                options={[
                  { label: 'On Create', value: 'created' },
                  { label: 'On Update', value: 'updated' },
                ]}
                onChange={(value) => patch({ event: value })}
              />
            </div>

            {(config.event || 'created') === 'updated' ? (
              <>
                <div>
                  <Typography.Text type="secondary">Field to Watch</Typography.Text>
                  <Select
                    style={{ width: '100%' }}
                    value={config.field}
                    options={fieldOptions}
                    onChange={(value) => patch({ field: value })}
                  />
                </div>

                <div>
                  <Typography.Text type="secondary">Update Rule</Typography.Text>
                  <Select
                    style={{ width: '100%' }}
                    value={config.updateRule || 'any'}
                    options={[
                      { label: 'Any update', value: 'any' },
                      { label: 'First time updated', value: 'first_time' },
                      { label: 'Equals exact value', value: 'equals' },
                      { label: 'Contains value', value: 'contains' },
                      { label: 'Changed from X to Y', value: 'from_to' },
                    ]}
                    onChange={(value) => patch({ updateRule: value })}
                  />
                </div>

                {config.updateRule === 'equals' || config.updateRule === 'contains' ? (
                  <div>
                    <Typography.Text type="secondary">Value</Typography.Text>
                    {renderValueInput(config.value || '', (value) => patch({ value }), 'Enter expected value')}
                  </div>
                ) : null}

                {config.updateRule === 'from_to' ? (
                  <>
                    <div>
                      <Typography.Text type="secondary">From</Typography.Text>
                      {renderValueInput(config.from || '', (value) => patch({ from: value }), 'From value')}
                    </div>
                    <div>
                      <Typography.Text type="secondary">To</Typography.Text>
                      {renderValueInput(config.to || '', (value) => patch({ to: value }), 'To value')}
                    </div>
                  </>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}

        {nodeType === NODE_TYPES.WAIT_TIMER ? (
          <>
            <div>
              <Typography.Text type="secondary">Mode</Typography.Text>
              <Select
                style={{ width: '100%' }}
                value={config.mode || 'immediate'}
                options={[
                  { label: 'Immediate', value: 'immediate' },
                  { label: 'Timer', value: 'timer' },
                ]}
                onChange={(value) => patch({ mode: value })}
              />
            </div>
            {(config.mode || 'immediate') === 'timer' ? (
              <>
                <div>
                  <Typography.Text type="secondary">Duration</Typography.Text>
                  <Input
                    type="number"
                    min={1}
                    value={config.duration ?? config.seconds ?? 0}
                    onChange={(e) => {
                      const duration = Number(e.target.value || 0);
                      patch({ duration, seconds: duration });
                    }}
                  />
                </div>
                <div>
                  <Typography.Text type="secondary">Unit</Typography.Text>
                  <Select
                    style={{ width: '100%' }}
                    value={config.unit || 'seconds'}
                    options={waitUnitOptions}
                    onChange={(value) => patch({ unit: value })}
                  />
                </div>
              </>
            ) : null}
          </>
        ) : null}

        {nodeType === NODE_TYPES.CONDITION_CHECK ? (
          <>
            <div>
              <Typography.Text type="secondary">Schema</Typography.Text>
              <Select
                style={{ width: '100%' }}
                value={schemaKey}
                options={schemaOptions}
                onChange={(value) => patch({ schema: value })}
              />
            </div>

            {renderConditionGroup(conditionGroup, true)}
          </>
        ) : null}

        {nodeType === NODE_TYPES.ACTION_SEND_MESSAGE ? (
          <>
            <div>
              <Typography.Text type="secondary">Channel</Typography.Text>
              <Select
                style={{ width: '100%' }}
                value={config.channel || 'email'}
                options={channelOptions}
                onChange={(value) => patch({ channel: value })}
              />
            </div>

            {(config.channel || 'email') === 'email' ? (
              <>
                <div>
                  <Typography.Text type="secondary">Template Source</Typography.Text>
                  <Select
                    style={{ width: '100%' }}
                    value={config.templateSource || 'saved'}
                    options={[
                      { label: 'Saved Template', value: 'saved' },
                      { label: 'Inline Custom', value: 'inline' },
                    ]}
                    onChange={(value) => patch({ templateSource: value })}
                  />
                </div>

                {(config.templateSource || 'saved') === 'saved' ? (
                  <>
                    <div>
                      <Typography.Text type="secondary">Select Template</Typography.Text>
                      <Select
                        showSearch
                        style={{ width: '100%' }}
                        value={config.templateId || undefined}
                        options={emailTemplates.map((t) => ({
                          label: `${t.name}${t.scopeSchema ? ` (${t.scopeSchema})` : ''}`,
                          value: t._id,
                        }))}
                        placeholder="Choose email template"
                        onChange={(value) => patch({ templateId: value })}
                      />
                    </div>

                    {selectedTemplate ? (
                      <Card size="small" title="Template Preview">
                        <Typography.Paragraph style={{ marginBottom: 6 }}>
                          <strong>Subject:</strong> {selectedTemplate.subject || '-'}
                        </Typography.Paragraph>
                        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                          {stripHtml(selectedTemplate.body).slice(0, 220)}
                        </Typography.Paragraph>
                        <div
                          style={{
                            marginTop: 8,
                            maxHeight: 180,
                            overflow: 'auto',
                            border: '1px solid #e4e6eb',
                            borderRadius: 8,
                            padding: 8,
                            background: '#fff',
                          }}
                          dangerouslySetInnerHTML={{
                            __html: selectedTemplate.body || '',
                          }}
                        />
                      </Card>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div>
                      <Typography.Text type="secondary">Subject</Typography.Text>
                      <Input
                        value={config.subject || ''}
                        onChange={(e) => patch({ subject: e.target.value })}
                        placeholder="Subject"
                      />
                    </div>
                    <div>
                      <Typography.Text type="secondary">Template Body (HTML)</Typography.Text>
                      <Input.TextArea
                        rows={6}
                        value={config.templateBody || ''}
                        onChange={(e) => patch({ templateBody: e.target.value })}
                        placeholder="<p>Hello {{lead.firstName}}</p>"
                      />
                    </div>
                  </>
                )}
              </>
            ) : (
              <div>
                <Typography.Text type="secondary">Message Body</Typography.Text>
                <Input.TextArea
                  rows={4}
                  value={config.templateBody || ''}
                  onChange={(e) => patch({ templateBody: e.target.value })}
                  placeholder="Message body"
                />
              </div>
            )}
          </>
        ) : null}
      </Space>
    </Card>
  );
}
