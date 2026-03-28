const { Candidate } = require("../models/candidate.model");
const { parseCv } = require("../utils/parse-cv");
const { analyzeCvByGemini } = require("./ai.service");
const { getOrCreateSettings } = require("./settings.service");
const {
  getAttachmentContent,
  getMessageDetailById,
} = require("./gmail.service");
const { AppError } = require("../utils/app-error");
const fs = require("node:fs/promises");
const path = require("node:path");
const ANALYZE_EMAIL_DEBUG = process.env.ANALYZE_EMAIL_DEBUG !== "false";
const CV_UPLOAD_DIR = path.resolve(__dirname, "../../uploads/cv");

const debugAnalyzeEmail = (stage, payload) => {
  if (!ANALYZE_EMAIL_DEBUG) {
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[analyze-email] ${stage}:`, JSON.stringify(payload, null, 2));
};

const sanitizeFilename = (filename = "") => {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return safe || "cv_file";
};

const inferExtensionFromMime = (mimeType = "") => {
  const mime = mimeType.toLowerCase();
  if (mime.includes("pdf")) {
    return ".pdf";
  }
  if (mime.includes("jpeg")) {
    return ".jpg";
  }
  if (mime.includes("png")) {
    return ".png";
  }
  if (mime.includes("webp")) {
    return ".webp";
  }
  if (mime.includes("heic")) {
    return ".heic";
  }
  if (mime.includes("msword")) {
    return ".doc";
  }
  if (mime.includes("officedocument.wordprocessingml")) {
    return ".docx";
  }
  if (mime.startsWith("text/")) {
    return ".txt";
  }

  return ".bin";
};

const saveCvAttachmentFile = async ({
  messageId,
  attachmentName,
  mimeType,
  dataBase64,
}) => {
  if (!dataBase64) {
    return null;
  }

  await fs.mkdir(CV_UPLOAD_DIR, { recursive: true });
  const safeOriginalName = sanitizeFilename(attachmentName || "cv_file");
  const originalExt = path.extname(safeOriginalName);
  const finalExt = originalExt || inferExtensionFromMime(mimeType);
  const originalNameWithoutExt = path.basename(
    safeOriginalName,
    originalExt || undefined,
  );
  const safeMessageId = sanitizeFilename(messageId || "no_message");
  const storedFilename = `${Date.now()}_${safeMessageId}_${originalNameWithoutExt}${finalExt}`;
  const absolutePath = path.join(CV_UPLOAD_DIR, storedFilename);
  const fileBuffer = Buffer.from(dataBase64, "base64");
  await fs.writeFile(absolutePath, fileBuffer);

  return {
    fileUrl: `/uploads/cv/${storedFilename}`,
    mimeType: mimeType || "application/octet-stream",
    size: fileBuffer.length,
  };
};

const applyDecisionRules = (analysis, settings) => {
  let decision = analysis.decision;
  let reason = analysis.reason;

  if (analysis.score < 60) {
    decision = "reject";
    reason = "Điểm dưới ngưỡng 60 (áp dụng theo quy tắc hệ thống).";
  }

  if (Array.isArray(settings.criteria) && settings.criteria.length > 0) {
    reason = `${reason}`;
  }

  return { decision, reason };
};

const analyzeCandidate = async ({ userId, payload }) => {
  let campaignId = null;
  if (payload?.campaignId) {
    const campaign = await getCampaignEntity(userId, payload.campaignId);
    campaignId = campaign._id;
  }

  const cvText = await parseCv({
    rawText: payload.raw_cv_text,
    snippet: payload.snippet,
  });

  const settings = await getOrCreateSettings(userId);
  const analysis = await analyzeCvByGemini(cvText, {
    settings: {
      criteria: settings.criteria,
      autoRejectEnabled: settings.autoRejectEnabled,
      autoPassEnabled: settings.autoPassEnabled,
    },
  });
  const ruleDecision = applyDecisionRules(analysis, settings);

  const candidate = await Candidate.create({
    userId,
    campaignId,
    name: analysis.name || payload.name || "",
    email: payload.email || "",
    skills: analysis.skills || [],
    experience_years: analysis.experience_years || 0,
    strengths: analysis.strengths || [],
    weaknesses: analysis.weaknesses || [],
    score: analysis.score || 0,
    decision: ruleDecision.decision,
    reason: ruleDecision.reason,
    raw_cv_text: cvText,
  });

  return candidate;
};

const extractEmailFromHeader = (fromHeader = "") => {
  const emailMatch = fromHeader.match(/<([^>]+)>/);
  if (emailMatch?.[1]) {
    return emailMatch[1].trim().toLowerCase();
  }

  if (fromHeader.includes("@")) {
    return fromHeader.trim().toLowerCase();
  }

  return "";
};

const extractNameFromHeader = (fromHeader = "") => {
  const noEmail = fromHeader
    .replace(/<[^>]+>/g, "")
    .replace(/"/g, "")
    .trim();
  return noEmail || "";
};

const isSupportedCvAttachment = (attachment) => {
  const name = (attachment?.filename || "").toLowerCase();
  const mimeType = (attachment?.mimeType || "").toLowerCase();
  const supportedExtension =
    name.endsWith(".pdf") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".txt") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp") ||
    name.endsWith(".heic");
  const supportedMime =
    mimeType.includes("pdf") ||
    mimeType.includes("msword") ||
    mimeType.includes("officedocument") ||
    mimeType.startsWith("text/") ||
    mimeType.startsWith("image/");

  return supportedExtension || supportedMime;
};

const getAttachmentPriorityScore = (attachment) => {
  const filename = (attachment?.filename || "").toLowerCase();
  let score = 0;

  if (filename.includes("cv")) {
    score += 5;
  }
  if (filename.includes("resume")) {
    score += 5;
  }
  if (filename.includes("portfolio")) {
    score += 2;
  }
  if (filename.endsWith(".pdf")) {
    score += 2;
  }
  if (filename.endsWith(".doc") || filename.endsWith(".docx")) {
    score += 1;
  }

  return score;
};

const analyzeCandidateFromEmail = async ({ userId, payload }) => {
  const debugId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const messageId =
    typeof payload?.messageId === "string" ? payload.messageId.trim() : "";
  if (!messageId) {
    throw new AppError("messageId is required", 400);
  }

  debugAnalyzeEmail("start", {
    debugId,
    userId,
    payload,
    note: "Flow email chỉ dùng messageId. campaignId bị bỏ qua.",
  });

  const campaignId = null;

  const message = await getMessageDetailById({ userId, messageId });
  debugAnalyzeEmail("message-detail", {
    debugId,
    messageId,
    from: message.from,
    subject: message.subject,
    attachments: (message.attachments || []).map((item) => ({
      filename: item.filename,
      mimeType: item.mimeType,
      size: item.size,
      attachmentId: item.attachmentId,
      hasInlineData: Boolean(item.inlineData),
    })),
  });

  const supportedAttachments = (message.attachments || []).filter(
    isSupportedCvAttachment,
  );
  const selectedAttachment = supportedAttachments.sort(
    (left, right) =>
      getAttachmentPriorityScore(right) - getAttachmentPriorityScore(left),
  )[0];
  if (!selectedAttachment?.attachmentId) {
    if (selectedAttachment?.inlineData) {
      debugAnalyzeEmail("use-inline-attachment", {
        debugId,
        filename: selectedAttachment.filename,
        mimeType: selectedAttachment.mimeType,
        base64Length: selectedAttachment.inlineData.length,
      });
    } else {
      debugAnalyzeEmail("no-supported-attachment", {
        debugId,
        messageId,
        attachmentCount: Array.isArray(message.attachments)
          ? message.attachments.length
          : 0,
        supportedAttachmentCount: supportedAttachments.length,
        note: "Dừng flow vì chưa lấy được file CV đính kèm hợp lệ.",
      });
      throw new AppError(
        "Không tìm thấy file CV đính kèm hợp lệ trong email (pdf/doc/docx/txt/image).",
        400,
      );
    }
  }

  let attachment = null;
  if (selectedAttachment?.inlineData) {
    attachment = {
      filename: selectedAttachment.filename,
      mimeType: selectedAttachment.mimeType || "application/pdf",
      dataBase64: selectedAttachment.inlineData,
    };
    debugAnalyzeEmail("inline-attachment-ready", {
      debugId,
      note: "Attachment đến từ inline data, bỏ qua bước attachments.get",
    });
  } else {
    debugAnalyzeEmail("fetch-attachment-start", {
      debugId,
      messageId,
      filename: selectedAttachment.filename,
      mimeType: selectedAttachment.mimeType,
      attachmentId: selectedAttachment.attachmentId,
    });
    const attachmentContent = await getAttachmentContent({
      userId,
      messageId,
      attachmentId: selectedAttachment.attachmentId,
    });
    attachment = {
      filename: selectedAttachment.filename,
      mimeType: selectedAttachment.mimeType || "application/pdf",
      dataBase64: attachmentContent.data,
    };
    debugAnalyzeEmail("fetch-attachment-done", {
      debugId,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      base64Length: String(attachment.dataBase64 || "").length,
      byteSize: attachmentContent.size,
    });
  }

  const savedFile = await saveCvAttachmentFile({
    messageId,
    attachmentName: attachment?.filename || selectedAttachment.filename,
    mimeType: attachment?.mimeType || selectedAttachment.mimeType,
    dataBase64: attachment?.dataBase64 || "",
  });
  debugAnalyzeEmail("save-attachment-file", {
    debugId,
    saved: Boolean(savedFile),
    fileUrl: savedFile?.fileUrl || "",
    mimeType: savedFile?.mimeType || "",
    size: savedFile?.size || 0,
  });

  const cvText = await parseCv({
    rawText: payload.raw_cv_text,
    snippet:
      `${message.subject}\n${message.snippet}\n${message.plainText}`.trim(),
  });
  debugAnalyzeEmail("parse-cv", {
    debugId,
    cvTextLength: cvText.length,
    snippetLength:
      `${message.subject}\n${message.snippet}\n${message.plainText}`.trim()
        .length,
  });

  const settings = await getOrCreateSettings(userId);
  debugAnalyzeEmail("load-settings", {
    debugId,
    criteriaCount: Array.isArray(settings.criteria)
      ? settings.criteria.length
      : 0,
  });

  debugAnalyzeEmail("gemini-start", {
    debugId,
    hasAttachment: Boolean(attachment?.dataBase64),
  });
  const analysis = await analyzeCvByGemini(
    { cvText, attachment },
    {
      settings: {
        criteria: settings.criteria,
        autoRejectEnabled: settings.autoRejectEnabled,
        autoPassEnabled: settings.autoPassEnabled,
      },
    },
  );
  debugAnalyzeEmail("gemini-done", {
    debugId,
    output: {
      name: analysis.name,
      score: analysis.score,
      decision: analysis.decision,
      reason: analysis.reason,
    },
  });

  const ruleDecision = applyDecisionRules(analysis, settings);
  debugAnalyzeEmail("apply-rules", {
    debugId,
    before: { decision: analysis.decision, reason: analysis.reason },
    after: ruleDecision,
  });

  const candidatePayload = {
    userId,
    campaignId,
    name: analysis.name || extractNameFromHeader(message.from),
    email: payload.email || extractEmailFromHeader(message.from),
    skills: analysis.skills || [],
    experience_years: analysis.experience_years || 0,
    strengths: analysis.strengths || [],
    weaknesses: analysis.weaknesses || [],
    score: analysis.score || 0,
    decision: ruleDecision.decision,
    reason: ruleDecision.reason,
    raw_cv_text: cvText,
    source_message_id: messageId,
    source_attachment_name: selectedAttachment?.filename || "",
    source_file_url: savedFile?.fileUrl || "",
    source_file_mime_type: savedFile?.mimeType || "",
    source_file_size: savedFile?.size || 0,
  };
  const existingCandidate = await Candidate.findOne({
    userId,
    source_message_id: messageId,
  }).select("_id");
  const candidate = await Candidate.findOneAndUpdate(
    {
      userId,
      source_message_id: messageId,
    },
    {
      $set: candidatePayload,
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    },
  );
  debugAnalyzeEmail("save-candidate", {
    debugId,
    candidateId: candidate._id,
    source_message_id: candidate.source_message_id,
    source_attachment_name: candidate.source_attachment_name,
    action: existingCandidate ? "updated" : "created",
  });

  return candidate;
};

const listCandidatesByUser = async (userId) => {
  return Candidate.find({ userId }).sort({ createdAt: -1 });
};

const getCandidateDetail = async ({ userId, candidateId }) => {
  return Candidate.findOne({ _id: candidateId, userId });
};

const unlinkStoredCvFile = async (fileUrl) => {
  if (
    !fileUrl ||
    typeof fileUrl !== "string" ||
    !fileUrl.startsWith("/uploads/cv/")
  ) {
    return;
  }

  const fileName = path.basename(fileUrl);
  const absolutePath = path.join(CV_UPLOAD_DIR, fileName);
  try {
    await fs.unlink(absolutePath);
  } catch {
    // file missing or permission — ignore
  }
};

const deleteCandidateByUser = async ({ userId, candidateId }) => {
  const candidate = await Candidate.findOne({ _id: candidateId, userId });
  if (!candidate) {
    throw new AppError("Candidate not found", 404);
  }

  await unlinkStoredCvFile(candidate.source_file_url);
  await Candidate.deleteOne({ _id: candidateId, userId });
};

module.exports = {
  analyzeCandidate,
  analyzeCandidateFromEmail,
  listCandidatesByUser,
  getCandidateDetail,
  deleteCandidateByUser,
};
