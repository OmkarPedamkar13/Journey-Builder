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

async function updateTemplate(id, payload) {
  const template = await Template.findById(id);
  if (!template) {
    const error = new Error('Template not found');
    error.status = 404;
    throw error;
  }

  if (payload.name !== undefined) template.name = payload.name;
  if (payload.channel !== undefined) template.channel = payload.channel;
  if (payload.scopeSchema !== undefined) template.scopeSchema = payload.scopeSchema || 'lead';
  if (payload.body !== undefined) template.body = payload.body;
  if (payload.type !== undefined) template.type = payload.type;
  if (payload.subject !== undefined) template.subject = payload.subject;
  if (payload.contentType !== undefined) template.contentType = payload.contentType;

  await template.save();
  return template;
}

async function deleteTemplate(id) {
  const template = await Template.findById(id);
  if (!template) {
    const error = new Error('Template not found');
    error.status = 404;
    throw error;
  }

  await Template.deleteOne({ _id: template._id });
  return { deleted: true, id };
}

module.exports = { listTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate };
