const { Queue } = require('bullmq');
const { createRedisConnection } = require('./redis');

const JOURNEY_QUEUE_NAME = 'journey-execution';

const connection = createRedisConnection();

const journeyQueue = new Queue(JOURNEY_QUEUE_NAME, {
  connection,
});

async function enqueueExecutionNode({ executionId, nodeId, delayMs = 0 }) {
  await journeyQueue.add(
    'process-node',
    { executionId, nodeId },
    {
      removeOnComplete: true,
      removeOnFail: false,
      delay: Math.max(0, Number(delayMs || 0)),
    }
  );
}

module.exports = {
  JOURNEY_QUEUE_NAME,
  journeyQueue,
  enqueueExecutionNode,
  connection,
};
