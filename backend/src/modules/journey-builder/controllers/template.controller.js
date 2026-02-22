const templateService = require('../services/template.service');

async function list(_req, res, next) {
  try {
    const templates = await templateService.listTemplates();
    res.json({ templates });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const template = await templateService.createTemplate(req.body);
    res.status(201).json({ template });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const template = await templateService.updateTemplate(req.params.id, req.body);
    res.json({ template });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, update };
