const express = require("express");

const {
  googleAuthCallback,
  googleAuthLogin,
  googleLogin,
  googleRefreshToken,
} = require("../controllers/auth.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const authRouter = express.Router();

authRouter.get("/google/login", googleAuthLogin);
authRouter.get("/google/callback", googleAuthCallback);
authRouter.post("/google", googleLogin);
authRouter.post("/google/refresh", authMiddleware, googleRefreshToken);

module.exports = authRouter;
