const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Account = require('../models/Account');

const schemaRegistry = {
  lead: {
    label: 'Lead',
    model: Lead,
  },
  customer: {
    label: 'Customer',
    model: Customer,
  },
  account: {
    label: 'Account',
    model: Account,
  },
};

function humanizeKey(key) {
  return String(key)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function listSchemas() {
  return Object.entries(schemaRegistry).map(([key, value]) => ({
    key,
    label: value.label,
  }));
}

function getSchemaFieldMetadata(schemaKey) {
  const schemaConfig = schemaRegistry[schemaKey];

  if (!schemaConfig) {
    const error = new Error(`Unsupported schema: ${schemaKey}`);
    error.status = 404;
    throw error;
  }

  const fields = [];

  schemaConfig.model.schema.eachPath((pathName, schemaType) => {
    if (pathName === '__v') return;

    fields.push({
      key: pathName,
      label: humanizeKey(pathName),
      type: schemaType.instance || 'Mixed',
      required: Boolean(schemaType.options?.required),
      enum: Array.isArray(schemaType.options?.enum) ? schemaType.options.enum : undefined,
    });
  });

  return {
    key: schemaKey,
    label: schemaConfig.label,
    fields,
  };
}

module.exports = {
  listSchemas,
  getSchemaFieldMetadata,
};
