const IORedis = require('ioredis');

function createRedisConnection() {
  const url = process.env.REDIS_URL;

  if (url) {
    return new IORedis(url, {
      maxRetriesPerRequest: null,
    });
  }

  return new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    maxRetriesPerRequest: null,
  });
}

module.exports = { createRedisConnection };
