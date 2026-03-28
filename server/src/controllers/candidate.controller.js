const {
  analyzeCandidate,
  analyzeCandidateFromEmail,
  listCandidatesByUser,
  getCandidateDetail,
  deleteCandidateByUser,
} = require("../services/candidate.service");
const { formatResponse } = require("../utils/format-response");
const { AppError } = require("../utils/app-error");

const analyzeCandidateController = async (req, res, next) => {
  try {
    const candidate = await analyzeCandidate({
      userId: req.user.id,
      payload: req.body,
    });

    res.status(201).json(
      formatResponse({
        message: "Candidate analyzed",
        data: candidate,
      }),
    );
  } catch (error) {
    next(error);
  }
};

const getCandidatesController = async (req, res, next) => {
  try {
    const candidates = await listCandidatesByUser(req.user.id);

    res.json(
      formatResponse({
        data: candidates,
      }),
    );
  } catch (error) {
    next(error);
  }
};

const analyzeCandidateFromEmailController = async (req, res, next) => {
  try {
    const candidate = await analyzeCandidateFromEmail({
      userId: req.user.id,
      payload: req.body,
    });

    res.status(201).json(
      formatResponse({
        message: "Candidate analyzed from email",
        data: candidate,
      }),
    );
  } catch (error) {
    next(error);
  }
};

const getCandidateDetailController = async (req, res, next) => {
  try {
    const candidate = await getCandidateDetail({
      userId: req.user.id,
      candidateId: req.params.id,
    });

    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }

    res.json(
      formatResponse({
        data: candidate,
      }),
    );
  } catch (error) {
    next(error);
  }
};

const deleteCandidateController = async (req, res, next) => {
  try {
    await deleteCandidateByUser({
      userId: req.user.id,
      candidateId: req.params.id,
    });

    res.json(
      formatResponse({
        message: "Candidate deleted",
      }),
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeCandidateController,
  analyzeCandidateFromEmailController,
  getCandidatesController,
  getCandidateDetailController,
  deleteCandidateController,
};
