const express = require("express");

const {
  createCriterionController,
  deleteCriterionController,
  getSettingsController,
  updateCriterionController,
  updateSettingsController,
} = require("../controllers/settings.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const settingsRouter = express.Router();

settingsRouter.use(authMiddleware);
settingsRouter.get("/", getSettingsController);
settingsRouter.put("/", updateSettingsController);
settingsRouter.post("/criteria", createCriterionController);
settingsRouter.patch("/criteria/:id", updateCriterionController);
settingsRouter.delete("/criteria/:id", deleteCriterionController);

module.exports = settingsRouter;
