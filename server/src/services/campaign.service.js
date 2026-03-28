const mongoose = require("mongoose");

const { Campaign } = require("../models/campaign.model");
const { Candidate } = require("../models/candidate.model");
const { AppError } = require("../utils/app-error");

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("Invalid date format", 400);
  }

  return date;
};

const mapCampaignToResponse = (campaign) => ({
  id: campaign._id.toString(),
  name: campaign.name,
  description: campaign.description || "",
  startDate: campaign.startDate,
  endDate: campaign.endDate,
  isEnabled: Boolean(campaign.isEnabled),
  autoRejectEnabled: Boolean(campaign.autoRejectEnabled),
  autoPassEnabled: Boolean(campaign.autoPassEnabled),
  createdAt: campaign.createdAt,
  updatedAt: campaign.updatedAt,
});

const buildCampaignStats = async ({ userId, campaignIds }) => {
  if (!campaignIds.length) {
    return new Map();
  }

  const objectIds = campaignIds.map((id) => new mongoose.Types.ObjectId(id));
  const rows = await Candidate.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        campaignId: { $in: objectIds },
      },
    },
    {
      $group: {
        _id: { campaignId: "$campaignId", decision: "$decision" },
        count: { $sum: 1 },
      },
    },
  ]);

  const statsByCampaignId = new Map();
  campaignIds.forEach((id) => {
    statsByCampaignId.set(id, { totalApply: 0, totalPass: 0, totalReject: 0 });
  });

  rows.forEach((row) => {
    const campaignId = row._id.campaignId.toString();
    const stats = statsByCampaignId.get(campaignId) || {
      totalApply: 0,
      totalPass: 0,
      totalReject: 0,
    };
    stats.totalApply += row.count;
    if (row._id.decision === "pass") {
      stats.totalPass += row.count;
    }
    if (row._id.decision === "reject") {
      stats.totalReject += row.count;
    }
    statsByCampaignId.set(campaignId, stats);
  });

  return statsByCampaignId;
};

const createCampaign = async (userId, payload) => {
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  if (!name) {
    throw new AppError("name is required", 400);
  }

  const campaign = await Campaign.create({
    userId,
    name,
    description: typeof payload?.description === "string" ? payload.description.trim() : "",
    startDate: parseDateValue(payload?.startDate),
    endDate: parseDateValue(payload?.endDate),
    isEnabled: typeof payload?.isEnabled === "boolean" ? payload.isEnabled : true,
    autoRejectEnabled:
      typeof payload?.autoRejectEnabled === "boolean"
        ? payload.autoRejectEnabled
        : true,
    autoPassEnabled:
      typeof payload?.autoPassEnabled === "boolean" ? payload.autoPassEnabled : false,
  });

  return mapCampaignToResponse(campaign);
};

const listCampaigns = async (userId) => {
  const campaigns = await Campaign.find({ userId }).sort({ createdAt: -1 });
  const campaignIds = campaigns.map((campaign) => campaign._id.toString());
  const statsByCampaignId = await buildCampaignStats({ userId, campaignIds });

  return campaigns.map((campaign) => {
    const mapped = mapCampaignToResponse(campaign);
    const stats = statsByCampaignId.get(mapped.id) || {
      totalApply: 0,
      totalPass: 0,
      totalReject: 0,
    };

    return {
      ...mapped,
      ...stats,
    };
  });
};

const getCampaignEntity = async (userId, campaignId) => {
  const campaign = await Campaign.findOne({ _id: campaignId, userId });
  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }
  return campaign;
};

const updateCampaign = async (userId, campaignId, payload) => {
  const campaign = await getCampaignEntity(userId, campaignId);

  if (typeof payload?.name === "string") {
    const name = payload.name.trim();
    if (!name) {
      throw new AppError("name cannot be empty", 400);
    }
    campaign.name = name;
  }

  if (typeof payload?.description === "string") {
    campaign.description = payload.description.trim();
  }

  if ("startDate" in payload) {
    campaign.startDate = parseDateValue(payload.startDate);
  }

  if ("endDate" in payload) {
    campaign.endDate = parseDateValue(payload.endDate);
  }

  if (typeof payload?.isEnabled === "boolean") {
    campaign.isEnabled = payload.isEnabled;
  }

  if (typeof payload?.autoRejectEnabled === "boolean") {
    campaign.autoRejectEnabled = payload.autoRejectEnabled;
  }

  if (typeof payload?.autoPassEnabled === "boolean") {
    campaign.autoPassEnabled = payload.autoPassEnabled;
  }

  await campaign.save();
  return mapCampaignToResponse(campaign);
};

const deleteCampaign = async (userId, campaignId) => {
  const campaign = await getCampaignEntity(userId, campaignId);
  await Candidate.deleteMany({ userId, campaignId: campaign._id });
  await campaign.deleteOne();
};

const getCampaignDetail = async (userId, campaignId) => {
  const campaign = await getCampaignEntity(userId, campaignId);
  const candidates = await Candidate.find({
    userId,
    campaignId: campaign._id,
  }).sort({ createdAt: -1 });

  const mappedCampaign = mapCampaignToResponse(campaign);
  const passCandidates = candidates.filter((item) => item.decision === "pass");
  const rejectCandidates = candidates.filter((item) => item.decision === "reject");

  return {
    ...mappedCampaign,
    totalApply: candidates.length,
    totalPass: passCandidates.length,
    totalReject: rejectCandidates.length,
    passCandidates,
    rejectCandidates,
  };
};

module.exports = {
  createCampaign,
  deleteCampaign,
  getCampaignDetail,
  getCampaignEntity,
  listCampaigns,
  updateCampaign,
};
