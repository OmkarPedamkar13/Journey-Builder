export const NODE_TYPES = {
  TRIGGER_EVENT: 'trigger.event',
  WAIT_TIMER: 'wait.timer',
  CONDITION_CHECK: 'condition.check',
  ACTION_SEND_MESSAGE: 'action.send.message',
  END_DISCARD: 'end.discard',
  END_SUCCESS: 'end.success',
};

export const NODE_LIBRARY = [
  {
    type: NODE_TYPES.TRIGGER_EVENT,
    label: 'Trigger',
    defaultConfig: {
      schema: 'lead',
      event: 'created',
      field: 'status',
      updateRule: 'any',
      from: 'CL',
      to: 'FL',
      value: 'FL',
    },
  },
  {
    type: NODE_TYPES.WAIT_TIMER,
    label: 'Wait Timer',
    defaultConfig: { mode: 'immediate', duration: 0, unit: 'seconds', seconds: 0 },
  },
  {
    type: NODE_TYPES.CONDITION_CHECK,
    label: 'Condition',
    defaultConfig: {
      schema: 'lead',
      conditionGroup: {
        id: 'group_root',
        kind: 'group',
        operator: 'and',
        items: [
          {
            id: 'rule_exists_email',
            kind: 'rule',
            ruleType: 'exists',
            field: 'personalEmail',
            value: '',
            from: '',
            to: '',
          },
        ],
      },
    },
  },
  {
    type: NODE_TYPES.ACTION_SEND_MESSAGE,
    label: 'Action: Send Message',
    defaultConfig: {
      channel: 'email',
      templateType: 'predefined',
      templateSource: 'inline',
      templateId: null,
      subject: '',
      templateBody: 'Hello {{lead.firstName}}, thank you.',
    },
  },
  {
    type: NODE_TYPES.END_SUCCESS,
    label: 'End: Success',
    defaultConfig: {},
  },
  {
    type: NODE_TYPES.END_DISCARD,
    label: 'End: Discard',
    defaultConfig: {},
  },
];

export function getNodeLibraryItem(type) {
  return NODE_LIBRARY.find((node) => node.type === type) || null;
}
