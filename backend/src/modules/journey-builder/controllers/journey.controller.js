const journeyService = require('../services/journey.service');

async function list(_req, res, next) {
  try {
    const journeys = await journeyService.listJourneys();
    res.json({ journeys });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const journey = await journeyService.getJourneyById(req.params.id);
    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }
    res.json({ journey });
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

async function update(req, res, next) {
  try {
    const journey = await journeyService.updateJourney(req.params.id, req.body);
    res.json({ journey });
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

async function remove(req, res, next) {
  try {
    const result = await journeyService.deleteJourney(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { list, getById, create, update, publish, remove };
