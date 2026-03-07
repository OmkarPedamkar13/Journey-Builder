const express = require('express');
const controller = require('../controllers/journey.controller');

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id/publish', controller.publish);
router.delete('/:id', controller.remove);

module.exports = router;
