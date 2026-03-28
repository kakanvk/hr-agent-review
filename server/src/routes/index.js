const express = require("express");

const authRoutes = require("./auth.routes");
const campaignRoutes = require("./campaign.routes");
const candidateRoutes = require("./candidate.routes");
const gmailRoutes = require("./gmail.routes");
const settingsRoutes = require("./settings.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/campaigns", campaignRoutes);
router.use("/candidates", candidateRoutes);
router.use("/gmail", gmailRoutes);
router.use("/settings", settingsRoutes);

module.exports = router;
