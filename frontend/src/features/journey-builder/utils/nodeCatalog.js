// src/constants/nodeCatalog.js

export const NODE_TYPES = {
  TRIGGER_EVENT: "trigger.event",
  WAIT_TIMER: "wait.timer",
  CONDITION_CHECK: "condition.check",
  SPLIT_ROUTER: "split.router",
  ACTION_SEND_MESSAGE: "action.send.message",
  END_DISCARD: "end.discard",
  END_SUCCESS: "end.success",
};

// Reverse map: "trigger.event" -> "TRIGGER_EVENT"
export const NODE_KEY_BY_TYPE = Object.fromEntries(
  Object.entries(NODE_TYPES).map(([key, type]) => [type, key])
);

export const NODE_DESCRIPTIONS = {
  TRIGGER_EVENT: "Select the event that starts your Zap",
  WAIT_TIMER: "Select the event",
  CONDITION_CHECK: "HELLO.CONDITION",
  SPLIT_ROUTER: "Split into parallel paths",
  ACTION_SEND_MESSAGE: "HELLO.ACTION_SEND_MESSAGE",
  END_DISCARD: "HELLO.END_DISCARD",
  END_SUCCESS: "HELLO.END_SUCCESS",
};

export const NODE_LIBRARY = [
  {
    type: NODE_TYPES.TRIGGER_EVENT,
    label: "Trigger",
    defaultConfig: {
      schema: "lead",
      event: "created",
      field: "status",
      updateRule: "any",
      from: "CL",
      to: "FL",
      value: "FL",
    },
  },
  {
    type: NODE_TYPES.WAIT_TIMER,
    label: "Delay",
    defaultConfig: { mode: "immediate", duration: 0, unit: "seconds", seconds: 0 },
  },
  {
    type: NODE_TYPES.CONDITION_CHECK,
    label: "Condition",
    defaultConfig: {
      schema: "lead",
      conditionGroup: {
        id: "group_root",
        kind: "group",
        operator: "and",
        items: [
          {
            id: "rule_exists_email",
            kind: "rule",
            ruleType: "exists",
            field: "personalEmail",
            value: "",
            from: "",
            to: "",
          },
        ],
      },
    },
  },
  {
    type: NODE_TYPES.SPLIT_ROUTER,
    label: "Split",
    defaultConfig: {
      schema: "lead",
      branches: [
        {
          id: "split_branch_1",
          label: "Path 1",
          ruleType: "exists",
          field: "personalEmail",
          value: "",
          from: "",
          to: "",
        },
        {
          id: "split_branch_2",
          label: "Path 2",
          ruleType: "contains",
          field: "status",
          value: "FL",
          from: "",
          to: "",
        },
      ],
    },
  },
  {
    type: NODE_TYPES.ACTION_SEND_MESSAGE,
    label: "Action: Send Message",
    defaultConfig: {
      channel: "email",
      templateType: "predefined",
      templateSource: "inline",
      templateId: null,
      subject: "",
      templateBody: "Hello {{lead.firstName}}, thank you.",
    },
  },
  {
    type: NODE_TYPES.END_SUCCESS,
    label: "End: Success",
    defaultConfig: {},
  },
  {
    type: NODE_TYPES.END_DISCARD,
    label: "End: Discard",
    defaultConfig: {},
  },
];

// ----- Helpers -----

export function getNodeLibraryItem(type) {
  return NODE_LIBRARY.find((node) => node.type === type) || null;
}

// Returns key like "TRIGGER_EVENT" for a type like "trigger.event"
export function getNodeKeyByType(type) {
  return NODE_KEY_BY_TYPE[type] || null;
}

// Returns description for a type like "trigger.event"
export function getNodeDescription(type) {
  const key = getNodeKeyByType(type);
  return key ? NODE_DESCRIPTIONS[key] || "" : "";
}

// Best helper for UI (title + description + key + defaults)
export function getNodeMeta(type) {
  const key = getNodeKeyByType(type);
  const libItem = getNodeLibraryItem(type);

  return {
    type, // e.g. "trigger.event"
    key, // e.g. "TRIGGER_EVENT"
    label: libItem?.label || "",
    description: key ? NODE_DESCRIPTIONS[key] || "" : "",
    defaultConfig: libItem?.defaultConfig || {},
  };
}
