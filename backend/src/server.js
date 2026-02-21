require('dotenv').config();

const app = require('./app');
const { connectDatabase } = require('./config/db');
const { startJourneyWorker } = require('./modules/journey-builder/queue/journeyWorker');

const port = process.env.PORT || 5002;

async function start() {
  await connectDatabase();
  startJourneyWorker();
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start backend', error);
  process.exit(1);
});
