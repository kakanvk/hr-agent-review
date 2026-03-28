const { AppError } = require("../utils/app-error");

const notFoundHandler = (_req, _res, next) => {
  next(new AppError("Route not found", 404));
};

const errorHandler = (error, req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const path = req.originalUrl || req.url || "";

  // eslint-disable-next-line no-console
  console.error("[API Error]", req.method, path, statusCode, error.message);
  if (error.stack && statusCode === 500) {
    // eslint-disable-next-line no-console
    console.error(error.stack);
  }

  res.status(statusCode).json({
    message: error.message || "Internal server error",
    error: statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR",
  });
};

module.exports = { notFoundHandler, errorHandler };
