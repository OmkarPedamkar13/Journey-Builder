const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const journeyBuilderRouter = require('./modules/journey-builder/routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/journey-builder', journeyBuilderRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
