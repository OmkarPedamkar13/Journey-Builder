const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    channel: {
      type: String,
      required: true,
      enum: ['email', 'whatsapp', 'sms'],
    },
    scopeSchema: {
      type: String,
      enum: ['lead', 'customer', 'account'],
      default: 'lead',
    },
    type: {
      type: String,
      enum: ['predefined', 'custom'],
      default: 'custom',
    },
    subject: { type: String, default: '' },
    contentType: {
      type: String,
      enum: ['text', 'html'],
      default: 'html',
    },
    body: { type: String, required: true },
    softDeleted: { type: Boolean, default: false },
    softDeletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Template', templateSchema);
