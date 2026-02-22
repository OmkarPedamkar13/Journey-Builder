const nodemailer = require('nodemailer');
const { pickFirst } = require('./entityContext.service');

let cachedTransporter;

function getPathValue(obj, path) {
  if (!obj || !path) return undefined;
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function toStringValue(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return '';
  return String(value);
}

function resolveTokenValue(token, context = {}, fallbackSchema = 'lead') {
  if (!token) return '';

  if (token.startsWith('entity.')) {
    const key = token.replace(/^entity\./, '');
    const entity = context?.primary?.current?.[fallbackSchema] || context?.current || {};
    return toStringValue(getPathValue(entity, key));
  }

  const parts = token.split('.');
  if (parts.length < 2) {
    const entity = context?.primary?.current?.[fallbackSchema] || context?.current || {};
    return toStringValue(getPathValue(entity, token));
  }

  const [schemaKey, ...fieldParts] = parts;
  const fieldPath = fieldParts.join('.');
  const entityValue = context?.currentEntities?.[schemaKey];
  const entity = pickFirst(entityValue);

  return toStringValue(getPathValue(entity, fieldPath));
}

function renderTemplate(template, context, schema = 'lead') {
  if (!template) return '';

  return String(template)
    .replace(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g, (_, token) => {
      return resolveTokenValue(token, context, schema);
    });
}

function getEmailFromEntity(entity) {
  const one = pickFirst(entity);
  return one?.personalEmail || one?.businessEmail || one?.email || one?.email2 || null;
}

function getPhoneFromEntity(entity) {
  const one = pickFirst(entity);
  return one?.mobile || one?.mobile2 || one?.mobile3 || one?.phone || one?.phone2 || null;
}

function getEmailTarget(context, triggerSchema = 'lead') {
  const entities = context?.currentEntities || {};
  const priority = [triggerSchema, 'lead', 'customer', 'account'];

  for (const schemaKey of priority) {
    const value = getEmailFromEntity(entities[schemaKey]);
    if (value) return value;
  }

  return null;
}

function getPhoneTarget(context, triggerSchema = 'lead') {
  const entities = context?.currentEntities || {};
  const priority = [triggerSchema, 'lead', 'customer', 'account'];

  for (const schemaKey of priority) {
    const value = getPhoneFromEntity(entities[schemaKey]);
    if (value) return value;
  }

  return null;
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).toLowerCase() === 'true';
}

function createTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const service = process.env.EMAIL_SERVICE || '';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('EMAIL_USER and EMAIL_PASS are required for email channel');
  }

  if (service.toLowerCase() === 'gmail') {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = parseBoolean(process.env.SMTP_SECURE, port === 465);

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return cachedTransporter;
}

async function sendEmail({ context, triggerSchema, message, subject, contentType = 'html' }) {
  const to = getEmailTarget(context, triggerSchema);

  if (!to) {
    return {
      accepted: false,
      channel: 'email',
      to: null,
      reason: 'No email field available on entity',
    };
  }

  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const mail = {
    from,
    to,
    subject: subject || process.env.EMAIL_DEFAULT_SUBJECT || 'Journey Update',
  };

  if (contentType === 'html') {
    mail.html = message;
  } else {
    mail.text = message;
  }

  const info = await transporter.sendMail(mail);

  return {
    accepted: true,
    providerMessageId: info.messageId,
    channel: 'email',
    to,
    message,
  };
}

async function sendMessage({ channel, context, triggerSchema, message, subject, contentType }) {
  if (channel === 'email') {
    return sendEmail({ context, triggerSchema, message, subject, contentType });
  }

  const to = getPhoneTarget(context, triggerSchema);

  console.log(`[journey:${channel}] send -> ${to || 'no-target'} | message: ${message}`);

  return {
    accepted: true,
    providerMessageId: `${channel}_${Date.now()}`,
    channel,
    to,
    message,
  };
}

module.exports = { renderTemplate, sendMessage };
