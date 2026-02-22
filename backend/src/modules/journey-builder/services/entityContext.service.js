const { relationRegistry, getSchemaModel } = require('./schemaRegistry.service');

function readPathValue(obj, path) {
  if (!obj || !path) return undefined;
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function normalizeId(value) {
  if (value == null) return null;
  return String(value);
}

function pickFirst(entity) {
  if (Array.isArray(entity)) return entity[0] || null;
  return entity || null;
}

async function resolveRelatedEntities(sourceSchema, sourceEntity) {
  const result = {};
  const relations = relationRegistry[sourceSchema] || {};

  for (const [targetSchema, relation] of Object.entries(relations)) {
    const model = getSchemaModel(targetSchema);
    if (!model) continue;

    const localValue = readPathValue(sourceEntity, relation.localField);
    const normalizedLocalValue = normalizeId(localValue);
    if (!normalizedLocalValue) {
      result[targetSchema] = relation.cardinality === 'many' ? [] : null;
      continue;
    }

    const query = { [relation.foreignField]: localValue };

    if (relation.cardinality === 'many') {
      const rows = await model.find(query).sort({ createdAt: -1 }).limit(100).lean();
      result[targetSchema] = rows;
    } else {
      const row = await model.findOne(query).lean();
      result[targetSchema] = row || null;
    }
  }

  return result;
}

async function buildJoinedContext({ schema, current, previous }) {
  const currentRelated = await resolveRelatedEntities(schema, current || {});
  const previousRelated = previous ? await resolveRelatedEntities(schema, previous || {}) : {};

  const currentEntities = {
    [schema]: current || {},
    ...currentRelated,
  };

  const previousEntities = {
    [schema]: previous || {},
    ...previousRelated,
  };

  return {
    schema,
    current: current || {},
    previous: previous || {},
    currentEntities,
    previousEntities,
    // Convenience aliases for single-entity access in placeholders.
    primary: {
      current: Object.fromEntries(
        Object.entries(currentEntities).map(([key, value]) => [key, pickFirst(value)])
      ),
      previous: Object.fromEntries(
        Object.entries(previousEntities).map(([key, value]) => [key, pickFirst(value)])
      ),
    },
  };
}

module.exports = {
  buildJoinedContext,
  pickFirst,
};

