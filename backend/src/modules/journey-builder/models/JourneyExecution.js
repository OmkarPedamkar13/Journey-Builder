const mongoose = require('mongoose');

const journeyExecutionSchema = new mongoose.Schema(
  {
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journey',
      required: true,
      index: true,
    },
    entitySchema: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    triggerEvent: { type: String, required: true },
    status: {
      type: String,
      enum: ['queued', 'started', 'completed', 'discarded', 'failed'],
      default: 'started',
      index: true,
    },
    logs: { type: [mongoose.Schema.Types.Mixed], default: [] },
    channel: { type: String, enum: ['email', 'whatsapp', 'sms'], default: null },
    waitSeconds: { type: Number, default: 0 },
    messagePreview: { type: String, default: '' },
    contextCurrent: { type: mongoose.Schema.Types.Mixed, required: true },
    contextPrevious: { type: mongoose.Schema.Types.Mixed, default: {} },
    currentNodeId: { type: String, default: null },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('JourneyExecution', journeyExecutionSchema);
