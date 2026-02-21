function notFound(req, res, _next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  res.status(status).json({
    message: error.message || 'Internal server error',
    details: error.details || undefined,
  });
}

module.exports = { notFound, errorHandler };
