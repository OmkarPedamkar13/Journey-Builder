const express = require('express');
const journeyRoutes = require('./journey.routes');
const templateRoutes = require('./template.routes');
const executionRoutes = require('./execution.routes');
const schemaRoutes = require('./schema.routes');

const router = express.Router();

router.use('/journeys', journeyRoutes);
router.use('/templates', templateRoutes);
router.use('/executions', executionRoutes);
router.use('/schemas', schemaRoutes);

module.exports = router;
