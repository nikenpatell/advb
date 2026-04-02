module.exports = (err, req, res, next) => {
  // Always log errors but hide sensitive implementation details in production
  console.error(`[Error] ${err.name || 'API Error'}: ${err.message}`);
  if (process.env.NODE_ENV === 'development') console.error(err.stack);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server System Failure";

  // MongoDB Unique Constraint (e.g. Email collision)
  if (err.code === 11000) {
    message = "An account with these credentials already exists in the system.";
    statusCode = 400;
  }

  // Security & Identity Tokens
  if (err.name === "TokenExpiredError") {
    message = "Your security session has expired. Please authorize again.";
    statusCode = 401;
  }
  if (err.name === "JsonWebTokenError") {
    message = "Malformed security signature detected. Access revoked.";
    statusCode = 401;
  }

  // Rate Limiting (express-rate-limit)
  if (err.statusCode === 429) {
    message = "Too many requests. Please wait before attempting again.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
