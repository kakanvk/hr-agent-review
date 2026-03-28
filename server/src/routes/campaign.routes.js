const express = require("express");

const {
  createCampaignController,
  deleteCampaignController,
  getCampaignDetailController,
  listCampaignsController,
  updateCampaignController,
} = require("../controllers/campaign.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const campaignRouter = express.Router();

campaignRouter.use(authMiddleware);
campaignRouter.get("/", listCampaignsController);
campaignRouter.post("/", createCampaignController);
campaignRouter.get("/:id", getCampaignDetailController);
campaignRouter.patch("/:id", updateCampaignController);
campaignRouter.delete("/:id", deleteCampaignController);

module.exports = campaignRouter;
