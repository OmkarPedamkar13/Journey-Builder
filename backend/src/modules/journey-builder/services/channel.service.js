const nodemailer = require('nodemailer');

let cachedTransporter;

function renderTemplate(template, entity, schema = 'lead') {
  if (!template) return '';

  return String(template)
    .replace(/{{\s*entity\.([a-zA-Z0-9_]+)\s*}}/g, (_, key) => {
      return entity?.[key] ?? '';
    })
    .replace(/{{\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*}}/g, (_, schemaName, key) => {
      if (!schemaName || schemaName === schema || schemaName === 'lead') {
        return entity?.[key] ?? '';
      }
      return '';
    });
}

function getEmailTarget(entity) {
  return entity?.personalEmail || entity?.businessEmail || entity?.email || null;
}

function getPhoneTarget(entity) {
  return entity?.mobile || entity?.mobile2 || entity?.phone || null;
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

async function sendEmail({ entity, message, subject, contentType = 'html' }) {
  const to = getEmailTarget(entity);

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

async function sendMessage({ channel, lead, message, subject, contentType }) {
  if (channel === 'email') {
    return sendEmail({ entity: lead, message, subject, contentType });
  }

  const to = getPhoneTarget(lead);

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
