const executionService = require('../services/execution.service');

function normalizeExternalEventPayload(body = {}) {
  const schema = body?.schema || body?.event?.schema || body?.entity?.schema;
  const event = body?.eventName || body?.event?.name || body?.event;
  const current = body?.current || body?.data?.current || body?.entity?.current || body?.payload?.current;
  const previous = body?.previous || body?.data?.previous || body?.entity?.previous || body?.payload?.previous;
  const includeDraft = Boolean(body?.includeDraft || body?.options?.includeDraft);

  return {
    schema,
    event,
    current,
    previous,
    includeDraft,
    eventId: body?.eventId || body?.event?.id || null,
    occurredAt: body?.occurredAt || body?.event?.occurredAt || null,
    source: body?.source || body?.meta?.source || null,
  };
}

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

async function triggerExternal(req, res, next) {
  try {
    const payload = normalizeExternalEventPayload(req.body);

    if (!payload.schema || !payload.event || !payload.current) {
      return res.status(400).json({
        message: 'Invalid payload',
        required: {
          schema: 'string',
          event: 'created|updated',
          current: 'object',
        },
      });
    }

    const result = await executionService.enqueueJourneysForEvent({
      schema: payload.schema,
      event: payload.event,
      current: payload.current,
      previous: payload.previous,
      options: { includeDraft: payload.includeDraft },
    });

    res.json({
      ok: true,
      received: {
        schema: payload.schema,
        event: payload.event,
        eventId: payload.eventId,
        occurredAt: payload.occurredAt,
        source: payload.source,
      },
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

async function externalContract(_req, res) {
  res.json({
    endpoint: '/api/journey-builder/executions/events',
    method: 'POST',
    notes: [
      'Use this endpoint from other apps/services.',
      'Existing /executions/trigger and lead test routes are kept for testing/internal use.',
    ],
    required: {
      schema: 'lead|customer|account',
      event: 'created|updated',
      current: 'object',
    },
    optional: {
      previous: 'object (recommended for updated events)',
      eventId: 'string (external event id)',
      occurredAt: 'ISO datetime string',
      source: 'string (service/app name)',
      includeDraft: 'boolean (default false)',
    },
    example: {
      schema: 'lead',
      event: 'updated',
      eventId: 'crm-lead-evt-100928',
      occurredAt: new Date().toISOString(),
      source: 'crm-service',
      current: {
        leadId: 'L-1001',
        firstName: 'John',
        status: 'FL',
        personalEmail: 'john@example.com',
      },
      previous: {
        leadId: 'L-1001',
        firstName: 'John',
        status: 'CL',
        personalEmail: 'john@example.com',
      },
      includeDraft: false,
    },
  });
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

    const relatedExecutions = await executionService.listExecutionFamily(execution);
    res.json({ execution, relatedExecutions });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  trigger,
  triggerExternal,
  externalContract,
  list,
  getById,
};
