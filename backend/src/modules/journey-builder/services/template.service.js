const Template = require('../models/Template');

async function listTemplates() {
  return Template.find().sort({ createdAt: -1 });
}

async function getTemplateById(id) {
  return Template.findById(id);
}

async function createTemplate(payload) {
  const template = await Template.create({
    name: payload.name,
    channel: payload.channel,
    scopeSchema: payload.scopeSchema || 'lead',
    body: payload.body,
    type: payload.type || 'custom',
    subject: payload.subject || '',
    contentType: payload.contentType || 'html',
  });

  return template;
}

module.exports = { listTemplates, getTemplateById, createTemplate };
