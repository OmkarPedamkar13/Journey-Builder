const express = require('express');
const controller = require('../controllers/journey.controller');

const router = express.Router();

router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id/publish', controller.publish);

module.exports = router;
