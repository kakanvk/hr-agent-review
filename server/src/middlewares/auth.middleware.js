const jwt = require("jsonwebtoken");

const { AppError } = require("../utils/app-error");

const authMiddleware = (req, _res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : "";

  if (!token) {
    return next(new AppError("Unauthorized", 401));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = { id: payload.id, email: payload.email };
    return next();
  } catch (_error) {
    return next(new AppError("Invalid token", 401));
  }
};

module.exports = { authMiddleware };
