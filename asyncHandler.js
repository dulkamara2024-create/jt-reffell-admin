// Wraps an async route handler so thrown errors/rejected promises reach
// Express's error handler instead of crashing the process.
module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
