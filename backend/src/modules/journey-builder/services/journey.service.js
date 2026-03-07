const Journey = require('../models/Journey');
const JourneyExecution = require('../models/JourneyExecution');
const { validateJourneyPayload } = require('../validators/journey.validator');

async function listJourneys() {
  return Journey.find().sort({ createdAt: -1 });
}

async function getJourneyById(id) {
  return Journey.findById(id);
}

async function createJourney(payload) {
  const validation = validateJourneyPayload(payload);

  if (!validation.valid) {
    const error = new Error('Invalid journey graph');
    error.status = 400;
    error.details = validation.errors;
    throw error;
  }

  const journey = await Journey.create({
    name: payload.name || 'Untitled Journey',
    triggerSchema: validation.triggerSchema,
    triggerEvent: validation.triggerEvent,
    graph: validation.graph,
    status: 'draft',
  });

  return journey;
}

async function updateJourney(id, payload) {
  const validation = validateJourneyPayload(payload);

  if (!validation.valid) {
    const error = new Error('Invalid journey graph');
    error.status = 400;
    error.details = validation.errors;
    throw error;
  }

  const journey = await Journey.findById(id);
  if (!journey) {
    const error = new Error('Journey not found');
    error.status = 404;
    throw error;
  }

  journey.name = payload.name || journey.name || 'Untitled Journey';
  journey.triggerSchema = validation.triggerSchema;
  journey.triggerEvent = validation.triggerEvent;
  journey.graph = validation.graph;
  journey.status = 'draft';
  await journey.save();

  return journey;
}

async function publishJourney(id) {
  const journey = await Journey.findById(id);
  if (!journey) {
    const error = new Error('Journey not found');
    error.status = 404;
    throw error;
  }

  journey.status = 'published';
  journey.version += 1;
  journey.lastPublishedAt = new Date();
  await journey.save();

  return journey;
}

async function deleteJourney(id) {
  const journey = await Journey.findById(id);
  if (!journey) {
    const error = new Error('Journey not found');
    error.status = 404;
    throw error;
  }

  await JourneyExecution.deleteMany({ journeyId: journey._id });
  await Journey.deleteOne({ _id: journey._id });

  return { deleted: true, id };
}

async function findPublishedJourneysByTrigger(triggerSchema, triggerEvent) {
  return Journey.find({
    status: 'published',
    $or: [
      { triggerSchema, triggerEvent },
      { triggerEvent: `${triggerSchema}.${triggerEvent}` },
    ],
  }).sort({ updatedAt: -1 });
}

async function findRunnableJourneysByTrigger(triggerSchema, triggerEvent, options = {}) {
  const includeDraft = Boolean(options.includeDraft);
  const statuses = includeDraft ? ['published', 'draft'] : ['published'];
  return Journey.find({
    status: { $in: statuses },
    $or: [
      { triggerSchema, triggerEvent },
      { triggerEvent: `${triggerSchema}.${triggerEvent}` },
    ],
  }).sort({ updatedAt: -1 });
}

module.exports = {
  listJourneys,
  getJourneyById,
  createJourney,
  updateJourney,
  publishJourney,
  deleteJourney,
  findPublishedJourneysByTrigger,
  findRunnableJourneysByTrigger,
};
