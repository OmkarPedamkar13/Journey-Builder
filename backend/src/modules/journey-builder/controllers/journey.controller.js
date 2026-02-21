const journeyService = require('../services/journey.service');

async function list(_req, res, next) {
  try {
    const journeys = await journeyService.listJourneys();
    res.json({ journeys });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const journey = await journeyService.createJourney(req.body);
    res.status(201).json({ journey });
  } catch (error) {
    next(error);
  }
}

async function publish(req, res, next) {
  try {
    const journey = await journeyService.publishJourney(req.params.id);
    res.json({ journey });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, publish };
