const express = require("express");

const { listGmailMessagesController } = require("../controllers/gmail.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const gmailRouter = express.Router();

gmailRouter.use(authMiddleware);
gmailRouter.get("/messages", listGmailMessagesController);

module.exports = gmailRouter;
