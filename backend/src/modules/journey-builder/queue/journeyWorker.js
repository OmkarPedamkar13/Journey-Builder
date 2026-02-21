const { Worker } = require('bullmq');
const { JOURNEY_QUEUE_NAME, connection } = require('./journeyQueue');
const { processExecutionNode } = require('../services/execution.service');

let worker;

function startJourneyWorker() {
  if (worker) return worker;

  worker = new Worker(
    JOURNEY_QUEUE_NAME,
    async (job) => {
      await processExecutionNode(job.data);
    },
    {
      connection,
      concurrency: Number(process.env.JOURNEY_WORKER_CONCURRENCY || 10),
    }
  );

  worker.on('failed', (job, error) => {
    console.error('[journey-worker] job failed', {
      jobId: job?.id,
      error: error?.message,
    });
  });

  worker.on('error', (error) => {
    console.error('[journey-worker] worker error', error?.message || error);
  });

  return worker;
}

module.exports = { startJourneyWorker };
