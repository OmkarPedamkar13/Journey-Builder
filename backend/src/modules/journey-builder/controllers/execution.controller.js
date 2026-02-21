const executionService = require('../services/execution.service');

async function trigger(req, res, next) {
  try {
    const result = await executionService.enqueueJourneysForEvent({
      schema: req.body.schema,
      event: req.body.event,
      current: req.body.current,
      previous: req.body.previous,
      options: { includeDraft: Boolean(req.body.includeDraft) },
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function triggerLeadCreated(req, res, next) {
  try {
    const result = await executionService.enqueueJourneysForEvent({
      schema: 'lead',
      event: 'created',
      current: req.body.lead,
      previous: null,
      options: { includeDraft: Boolean(req.body.includeDraft) },
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function triggerLeadUpdated(req, res, next) {
  try {
    const result = await executionService.enqueueJourneysForEvent({
      schema: 'lead',
      event: 'updated',
      current: req.body.lead,
      previous: req.body.previousLead,
      options: { includeDraft: Boolean(req.body.includeDraft) },
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const executions = await executionService.listExecutions();
    res.json({ executions });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const execution = await executionService.getExecutionById(req.params.id);
    if (!execution) {
      return res.status(404).json({ message: 'Execution not found' });
    }

    res.json({ execution });
  } catch (error) {
    next(error);
  }
}

module.exports = { trigger, triggerLeadCreated, triggerLeadUpdated, list, getById };
