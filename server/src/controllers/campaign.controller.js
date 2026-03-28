const {
  createCampaign,
  deleteCampaign,
  getCampaignDetail,
  listCampaigns,
  updateCampaign,
} = require("../services/campaign.service");
const { formatResponse } = require("../utils/format-response");

const listCampaignsController = async (req, res, next) => {
  try {
    const campaigns = await listCampaigns(req.user.id);
    res.json(
      formatResponse({
        data: campaigns,
      }),
    );
  } catch (error) {
    next(error);
  }
};

const createCampaignController = async (req, res, next) => {
  try {
    const campaign = await createCampaign(req.user.id, req.body);
    res.status(201).json(
      formatResponse({
        message: "Campaign created",
        data: campaign,
      }),
    );
  } catch (error) {
    next(error);
  }
};

const getCampaignDetailController = async (req, res, next) => {
  try {
    const campaign = await getCampaignDetail(req.user.id, req.params.id);
    res.json(
      formatResponse({
        data: campaign,
      }),
    );
  } catch (error) {
    next(error);
  }
};

const updateCampaignController = async (req, res, next) => {
  try {
    const campaign = await updateCampaign(req.user.id, req.params.id, req.body);
    res.json(
      formatResponse({
        message: "Campaign updated",
        data: campaign,
      }),
    );
  } catch (error) {
    next(error);
  }
};

const deleteCampaignController = async (req, res, next) => {
  try {
    await deleteCampaign(req.user.id, req.params.id);
    res.json(
      formatResponse({
        message: "Campaign deleted",
      }),
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCampaignController,
  deleteCampaignController,
  getCampaignDetailController,
  listCampaignsController,
  updateCampaignController,
};
