const schemaRegistryService = require('../services/schemaRegistry.service');

async function listSchemas(_req, res, next) {
  try {
    const schemas = schemaRegistryService.listSchemas();
    res.json({ schemas });
  } catch (error) {
    next(error);
  }
}

async function getSchemaFields(req, res, next) {
  try {
    const schema = schemaRegistryService.getSchemaFieldMetadata(req.params.schemaKey);
    res.json(schema);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listSchemas,
  getSchemaFields,
};
