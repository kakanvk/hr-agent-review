const { User } = require("../models/user.model");
const { refreshGoogleAccessToken } = require("./auth.service");
const { AppError } = require("../utils/app-error");

const GMAIL_LIST_ENDPOINT =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages";
const GMAIL_MESSAGE_ENDPOINT =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages";

const getHeaderValue = (headers = [], name) => {
  const header = headers.find(
    (item) => item.name?.toLowerCase() === name.toLowerCase(),
  );
  return header?.value || "";
};

const fetchMessagesWithToken = async ({
  accessToken,
  maxResults = 20,
  pageToken = "",
  queryString = "",
}) => {
  const listUrl = new URL(GMAIL_LIST_ENDPOINT);
  listUrl.searchParams.set("maxResults", String(maxResults));
  if (pageToken) {
    listUrl.searchParams.set("pageToken", pageToken);
  }
  if (queryString) {
    listUrl.searchParams.set("q", queryString);
  }

  const listResponse = await fetch(listUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (listResponse.status === 401) {
    throw new AppError("GOOGLE_ACCESS_TOKEN_EXPIRED", 401);
  }

  const listData = await listResponse.json();
  if (!listResponse.ok || listData.error) {
    throw new AppError(
      listData.error?.message || "Cannot fetch Gmail messages",
      400,
    );
  }

  const messages = listData.messages || [];
  const detailList = await Promise.all(
    messages.map(async (message) => {
      const detailUrl = new URL(`${GMAIL_MESSAGE_ENDPOINT}/${message.id}`);
      detailUrl.searchParams.set("format", "metadata");
      detailUrl.searchParams.set("metadataHeaders", "From");
      detailUrl.searchParams.append("metadataHeaders", "Subject");
      detailUrl.searchParams.append("metadataHeaders", "Date");

      const detailResponse = await fetch(detailUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!detailResponse.ok) {
        return null;
      }

      const detailData = await detailResponse.json();
      const headers = detailData.payload?.headers || [];
      const labelIds = Array.isArray(detailData.labelIds) ? detailData.labelIds : [];
      const isUnread = labelIds.includes("UNREAD");

      return {
        id: detailData.id,
        threadId: detailData.threadId,
        from: getHeaderValue(headers, "From"),
        subject: getHeaderValue(headers, "Subject"),
        date: getHeaderValue(headers, "Date"),
        isUnread,
      };
    }),
  );

  return {
    items: detailList.filter(Boolean),
    nextPageToken: listData.nextPageToken || "",
    resultSizeEstimate: listData.resultSizeEstimate || 0,
  };
};

const decodeBase64Url = (encoded = "") => {
  if (!encoded) {
    return "";
  }

  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized.padEnd(normalized.length + paddingLength, "=");
  return Buffer.from(padded, "base64").toString("utf8");
};

const normalizeBase64Url = (encoded = "") => {
  if (!encoded) {
    return "";
  }

  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  return normalized.padEnd(normalized.length + paddingLength, "=");
};

const collectMessageParts = (part, bucket) => {
  if (!part) {
    return;
  }

  const mimeType = part.mimeType || "";
  const filename = part.filename || "";
  const body = part.body || {};

  // Step 3: locate attachment descriptors in payload.parts
  // Gmail can return either attachmentId (requires attachments.get) or inline body.data.
  if (filename && (body.attachmentId || body.data)) {
    bucket.attachments.push({
      filename,
      mimeType,
      attachmentId: body.attachmentId || "",
      inlineData: normalizeBase64Url(body.data || ""),
      size: Number(body.size) || 0,
    });
  }

  if (mimeType === "text/plain" && body.data) {
    bucket.textParts.push(decodeBase64Url(body.data));
  }

  if (Array.isArray(part.parts) && part.parts.length > 0) {
    part.parts.forEach((nestedPart) => collectMessageParts(nestedPart, bucket));
  }
};

const fetchMessageDetailWithToken = async ({ accessToken, messageId }) => {
  const detailUrl = new URL(`${GMAIL_MESSAGE_ENDPOINT}/${messageId}`);
  detailUrl.searchParams.set("format", "full");

  const detailResponse = await fetch(detailUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (detailResponse.status === 401) {
    throw new AppError("GOOGLE_ACCESS_TOKEN_EXPIRED", 401);
  }

  const detailData = await detailResponse.json();
  if (!detailResponse.ok || detailData.error) {
    throw new AppError(detailData.error?.message || "Cannot fetch Gmail message detail", 400);
  }

  const headers = detailData.payload?.headers || [];
  const parsed = { textParts: [], attachments: [] };
  collectMessageParts(detailData.payload, parsed);

  return {
    id: detailData.id,
    threadId: detailData.threadId,
    snippet: detailData.snippet || "",
    from: getHeaderValue(headers, "From"),
    subject: getHeaderValue(headers, "Subject"),
    date: getHeaderValue(headers, "Date"),
    plainText: parsed.textParts.join("\n").trim(),
    attachments: parsed.attachments,
  };
};

const fetchAttachmentWithToken = async ({
  accessToken,
  messageId,
  attachmentId,
}) => {
  const attachmentUrl = `${GMAIL_MESSAGE_ENDPOINT}/${messageId}/attachments/${attachmentId}`;
  const response = await fetch(attachmentUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401) {
    throw new AppError("GOOGLE_ACCESS_TOKEN_EXPIRED", 401);
  }

  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new AppError(payload.error?.message || "Cannot fetch Gmail attachment", 400);
  }

  return {
    size: Number(payload.size) || 0,
    data: normalizeBase64Url(payload.data || ""),
  };
};

const listUserEmails = async ({ userId, maxResults = 20, pageToken = "", fromDate = "", toDate = "" }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.accessToken && !user.refreshToken) {
    throw new AppError(
      "Google account token not found. Please login again.",
      400,
    );
  }

  // Build Gmail API query string for date filtering
  const queryParts = [];
  if (fromDate) {
    queryParts.push(`after:${fromDate}`);
  }
  if (toDate) {
    // Gmail API uses 'before' which is exclusive, so we need to add 1 day
    const date = new Date(toDate);
    date.setDate(date.getDate() + 1);
    const nextDay = date.toISOString().split('T')[0];
    queryParts.push(`before:${nextDay}`);
  }
  const queryString = queryParts.join(" ");

  try {
    return await fetchMessagesWithToken({
      accessToken: user.accessToken,
      maxResults,
      pageToken,
      queryString,
    });
  } catch (error) {
    if (error.message !== "GOOGLE_ACCESS_TOKEN_EXPIRED") {
      throw error;
    }

    const refreshed = await refreshGoogleAccessToken(userId);
    return fetchMessagesWithToken({
      accessToken: refreshed.accessToken,
      maxResults,
      pageToken,
      queryString,
    });
  }
};

const getMessageDetailById = async ({ userId, messageId }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  try {
    return await fetchMessageDetailWithToken({
      accessToken: user.accessToken,
      messageId,
    });
  } catch (error) {
    if (error.message !== "GOOGLE_ACCESS_TOKEN_EXPIRED") {
      throw error;
    }

    const refreshed = await refreshGoogleAccessToken(userId);
    return fetchMessageDetailWithToken({
      accessToken: refreshed.accessToken,
      messageId,
    });
  }
};

const getAttachmentContent = async ({ userId, messageId, attachmentId }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  try {
    return await fetchAttachmentWithToken({
      accessToken: user.accessToken,
      messageId,
      attachmentId,
    });
  } catch (error) {
    if (error.message !== "GOOGLE_ACCESS_TOKEN_EXPIRED") {
      throw error;
    }

    const refreshed = await refreshGoogleAccessToken(userId);
    return fetchAttachmentWithToken({
      accessToken: refreshed.accessToken,
      messageId,
      attachmentId,
    });
  }
};

module.exports = { listUserEmails, getMessageDetailById, getAttachmentContent };
