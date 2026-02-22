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

const relationRegistry = {
  lead: {
    customer: {
      cardinality: 'one',
      localField: 'leadId',
      foreignField: 'leadId',
    },
    account: {
      cardinality: 'many',
      localField: 'leadId',
      foreignField: 'leadId',
    },
  },
  customer: {
    lead: {
      cardinality: 'one',
      localField: 'leadId',
      foreignField: 'leadId',
    },
    account: {
      cardinality: 'many',
      localField: '_id',
      foreignField: 'customerId',
    },
  },
  account: {
    lead: {
      cardinality: 'one',
      localField: 'leadId',
      foreignField: 'leadId',
    },
    customer: {
      cardinality: 'one',
      localField: 'customerId',
      foreignField: '_id',
    },
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

function getSchemaModel(schemaKey) {
  return schemaRegistry[schemaKey]?.model || null;
}

function getSchemaLabel(schemaKey) {
  return schemaRegistry[schemaKey]?.label || schemaKey;
}

function listContextSchemas(schemaKey) {
  const set = new Set([schemaKey]);
  const direct = relationRegistry[schemaKey] || {};
  Object.keys(direct).forEach((key) => set.add(key));
  return Array.from(set);
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

function getSchemaContextFieldMetadata(schemaKey) {
  const schemaKeys = listContextSchemas(schemaKey);
  const schemas = schemaKeys.map((key) => getSchemaFieldMetadata(key));
  return {
    key: schemaKey,
    label: getSchemaLabel(schemaKey),
    schemas,
  };
}

module.exports = {
  listSchemas,
  getSchemaFieldMetadata,
  getSchemaContextFieldMetadata,
  getSchemaModel,
  getSchemaLabel,
  relationRegistry,
};
