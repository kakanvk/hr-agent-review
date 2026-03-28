const { listUserEmails } = require("../services/gmail.service");
const { formatResponse } = require("../utils/format-response");

const listGmailMessagesController = async (req, res, next) => {
  try {
    const pageSize = Number(req.query.pageSize) || Number(req.query.maxResults) || 20;
    const safePageSize = Math.min(Math.max(pageSize, 1), 50);
    const pageToken = typeof req.query.pageToken === "string" ? req.query.pageToken : "";
    const messageResult = await listUserEmails({
      userId: req.user.id,
      maxResults: safePageSize,
      pageToken,
    });

    res.json(
      formatResponse({
        message: "Gmail messages fetched",
        data: {
          items: messageResult.items,
          nextPageToken: messageResult.nextPageToken,
          pageSize: safePageSize,
          resultSizeEstimate: messageResult.resultSizeEstimate,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { listGmailMessagesController };
