const express = require('express');
const controller = require('../controllers/execution.controller');

const router = express.Router();

router.post('/trigger', controller.trigger);
router.post('/events', controller.triggerExternal);
router.get('/events/contract', controller.externalContract);
router.get('/', controller.list);
router.get('/:id', controller.getById);

module.exports = router;
