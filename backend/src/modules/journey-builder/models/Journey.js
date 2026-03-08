const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    version: { type: Number, default: 1 },
    triggerSchema: { type: String, required: true, default: 'lead' },
    triggerEvent: { type: String, required: true, default: 'created' },
    graph: {
      nodes: { type: [mongoose.Schema.Types.Mixed], required: true, default: [] },
      edges: { type: [mongoose.Schema.Types.Mixed], required: true, default: [] },
      settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    lastPublishedAt: { type: Date },
    softDeleted: { type: Boolean, default: false },
    softDeletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

journeySchema.index({ status: 1, triggerSchema: 1, triggerEvent: 1 });

module.exports = mongoose.model('Journey', journeySchema);
