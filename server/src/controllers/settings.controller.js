const {
  createCriterion,
  deleteCriterion,
  getSettings,
  updateCriterion,
  updateSettings,
} = require("../services/settings.service");
const { formatResponse } = require("../utils/format-response");

const getSettingsController = async (req, res, next) => {
  try {
    const settings = await getSettings(req.user.id);

    res.json(
      formatResponse({
        data: settings,
      }),
    );
  } catch (error) {
    next(error);
  }
};

const updateSettingsController = async (req, res, next) => {
  try {
    const settings = await updateSettings(req.user.id, req.body);

    res.json(
      formatResponse({
        message: "Settings updated",
        data: settings,
      }),
    );
  } catch (error) {
    next(error);
  }
};

const createCriterionController = async (req, res, next) => {
  try {
    const settings = await createCriterion(req.user.id, req.body);
    res.status(201).json(
      formatResponse({
        message: "Criterion created",
        data: settings,
      }),
    );
  } catch (error) {
    next(error);
  }
};

const updateCriterionController = async (req, res, next) => {
  try {
    const settings = await updateCriterion(req.user.id, req.params.id, req.body);
    res.json(
      formatResponse({
        message: "Criterion updated",
        data: settings,
      }),
    );
  } catch (error) {
    next(error);
  }
};

const deleteCriterionController = async (req, res, next) => {
  try {
    const settings = await deleteCriterion(req.user.id, req.params.id);
    res.json(
      formatResponse({
        message: "Criterion deleted",
        data: settings,
      }),
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCriterionController,
  deleteCriterionController,
  getSettingsController,
  updateCriterionController,
  updateSettingsController,
};
