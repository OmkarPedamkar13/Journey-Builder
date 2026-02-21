const express = require('express');
const controller = require('../controllers/schema.controller');

const router = express.Router();

router.get('/', controller.listSchemas);
router.get('/:schemaKey/fields', controller.getSchemaFields);

module.exports = router;
