const express = require("express");

const {
  analyzeCandidateController,
  analyzeCandidateFromEmailController,
  getCandidatesController,
  getCandidateDetailController,
  deleteCandidateController,
} = require("../controllers/candidate.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const candidateRouter = express.Router();

candidateRouter.use(authMiddleware);
candidateRouter.post("/analyze", analyzeCandidateController);
candidateRouter.post("/analyze-from-email", analyzeCandidateFromEmailController);
candidateRouter.get("/", getCandidatesController);
candidateRouter.delete("/:id", deleteCandidateController);
candidateRouter.get("/:id", getCandidateDetailController);

module.exports = candidateRouter;
