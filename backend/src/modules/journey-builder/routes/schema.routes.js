const express = require('express');
const controller = require('../controllers/schema.controller');

const router = express.Router();

router.get('/', controller.listSchemas);
router.get('/:schemaKey/fields', controller.getSchemaFields);
router.get('/:schemaKey/context-fields', controller.getSchemaContextFields);

module.exports = router;
