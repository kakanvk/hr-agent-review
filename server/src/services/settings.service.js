const { Setting } = require("../models/setting.model");
const { AppError } = require("../utils/app-error");

const DEFAULT_SETTINGS = {
  criteria: [],
  autoRejectEnabled: true,
  autoPassEnabled: false,
};

const mapCriterionToResponse = (criterion) => ({
  id: criterion._id.toString(),
  title: criterion.name,
  description: criterion.description,
  enabled: Boolean(criterion.enabled),
});

const mapSettingsToResponse = (settings) => ({
  id: settings._id.toString(),
  criteria: settings.criteria.map(mapCriterionToResponse),
  autoRejectEnabled:
    typeof settings.autoRejectEnabled === "boolean"
      ? settings.autoRejectEnabled
      : true,
  autoPassEnabled:
    typeof settings.autoPassEnabled === "boolean"
      ? settings.autoPassEnabled
      : false,
  createdAt: settings.createdAt,
  updatedAt: settings.updatedAt,
});

const normalizeCriterionInput = (item) => {
  const title =
    typeof item?.title === "string"
      ? item.title.trim()
      : typeof item?.name === "string"
        ? item.name.trim()
        : "";
  const description =
    typeof item?.description === "string" ? item.description.trim() : "";
  const enabled = typeof item?.enabled === "boolean" ? item.enabled : true;

  return { title, description, enabled };
};

const sanitizeCriteria = (criteria) => {
  if (!Array.isArray(criteria)) {
    return [];
  }

  return criteria
    .map(normalizeCriterionInput)
    .filter((item) => item.title && item.description)
    .map((item) => ({
      name: item.title,
      description: item.description,
      enabled: item.enabled,
    }));
};

const getOrCreateSettings = async (userId) => {
  let settings = await Setting.findOne({ userId });

  if (!settings) {
    settings = await Setting.create({ userId, ...DEFAULT_SETTINGS });
  }

  return settings;
};

const getSettings = async (userId) => {
  const settings = await getOrCreateSettings(userId);
  return mapSettingsToResponse(settings);
};

const updateSettings = async (userId, payload) => {
  const settings = await getOrCreateSettings(userId);

  if (Array.isArray(payload.criteria)) {
    settings.criteria = sanitizeCriteria(payload.criteria);
  }

  if (typeof payload.autoRejectEnabled === "boolean") {
    settings.autoRejectEnabled = payload.autoRejectEnabled;
  }

  if (typeof payload.autoPassEnabled === "boolean") {
    settings.autoPassEnabled = payload.autoPassEnabled;
  }

  await settings.save();

  return mapSettingsToResponse(settings);
};

const createCriterion = async (userId, payload) => {
  const settings = await getOrCreateSettings(userId);
  const criterion = normalizeCriterionInput(payload);

  if (!criterion.title || !criterion.description) {
    throw new AppError("title and description are required", 400);
  }

  settings.criteria.unshift({
    name: criterion.title,
    description: criterion.description,
    enabled: criterion.enabled,
  });
  await settings.save();

  return mapSettingsToResponse(settings);
};

const updateCriterion = async (userId, criterionId, payload) => {
  const settings = await getOrCreateSettings(userId);
  const criterion = settings.criteria.id(criterionId);

  if (!criterion) {
    throw new AppError("Criterion not found", 404);
  }

  if (typeof payload?.title === "string") {
    const title = payload.title.trim();
    if (!title) {
      throw new AppError("title cannot be empty", 400);
    }
    criterion.name = title;
  }

  if (typeof payload?.description === "string") {
    const description = payload.description.trim();
    if (!description) {
      throw new AppError("description cannot be empty", 400);
    }
    criterion.description = description;
  }

  if (typeof payload?.enabled === "boolean") {
    criterion.enabled = payload.enabled;
  }

  await settings.save();
  return mapSettingsToResponse(settings);
};

const deleteCriterion = async (userId, criterionId) => {
  const settings = await getOrCreateSettings(userId);
  const criterion = settings.criteria.id(criterionId);

  if (!criterion) {
    throw new AppError("Criterion not found", 404);
  }

  criterion.deleteOne();
  await settings.save();
  return mapSettingsToResponse(settings);
};

module.exports = {
  createCriterion,
  deleteCriterion,
  getOrCreateSettings,
  getSettings,
  updateCriterion,
  updateSettings,
};
