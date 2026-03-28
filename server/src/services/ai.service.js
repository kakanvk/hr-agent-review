const { buildCvEvaluationPrompt } = require("../prompts/build-cv-evaluation-prompt");
const { AppError } = require("../utils/app-error");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_DEBUG = process.env.GEMINI_DEBUG === "true";
const GEMINI_DEBUG_TEXT_LIMIT = Number(process.env.GEMINI_DEBUG_TEXT_LIMIT) || 1200;

const truncateText = (value = "", limit = GEMINI_DEBUG_TEXT_LIMIT) => {
  const text = String(value || "");
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)} ...[truncated ${text.length - limit} chars]`;
};

const debugGemini = (stage, payload) => {
  if (!GEMINI_DEBUG) {
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[gemini-debug] ${stage}:`, JSON.stringify(payload, null, 2));
};

/** Luôn ghi terminal server khi Gemini / phân tích CV lỗi (không phụ thuộc GEMINI_DEBUG). */
const logGeminiError = (message, meta = {}) => {
  // eslint-disable-next-line no-console
  console.error("[Gemini CV]", message, meta);
};

const normalizeAnalysis = (payload, fallbackReason) => {
  const score = Math.max(0, Math.min(100, Number(payload?.score) || 0));
  const decision =
    payload?.decision === "pass" || payload?.decision === "reject"
      ? payload.decision
      : score >= 60
        ? "pass"
        : "reject";

  return {
    name: typeof payload?.name === "string" ? payload.name.trim() : "",
    skills: Array.isArray(payload?.skills)
      ? payload.skills.filter(Boolean).map(String)
      : [],
    experience_years: Number(payload?.experience_years) || 0,
    strengths: Array.isArray(payload?.strengths)
      ? payload.strengths.filter(Boolean).map(String)
      : [],
    weaknesses: Array.isArray(payload?.weaknesses)
      ? payload.weaknesses.filter(Boolean).map(String)
      : [],
    score,
    decision,
    reason:
      typeof payload?.reason === "string" && payload.reason.trim()
        ? payload.reason.trim()
        : fallbackReason,
  };
};

const extractJsonString = (rawText = "") => {
  const fencedMatch = rawText.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const objectMatch = rawText.match(/\{[\s\S]*\}/);
  return objectMatch ? objectMatch[0].trim() : "";
};

const resolveSettings = (options = {}) => {
  if (options.settings && typeof options.settings === "object") {
    return {
      criteria: Array.isArray(options.settings.criteria)
        ? options.settings.criteria
        : [],
      autoRejectEnabled: options.settings.autoRejectEnabled,
      autoPassEnabled: options.settings.autoPassEnabled,
    };
  }

  return {
    criteria: Array.isArray(options.criteria) ? options.criteria : [],
    autoRejectEnabled: undefined,
    autoPassEnabled: undefined,
  };
};

const analyzeCvByGemini = async (input, options = {}) => {
  const cvText = typeof input === "string" ? input : input?.cvText || "";
  const attachment =
    typeof input === "string" ? null : input?.attachment || null;
  const settings = resolveSettings(options);
  const debugId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const hasContent = Boolean(cvText.trim() || attachment?.dataBase64);

  if (!hasContent) {
    logGeminiError("Thiếu nội dung CV", { debugId });
    throw new AppError("Không tìm thấy dữ liệu CV để phân tích.", 400);
  }

  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    debugGemini("error-no-api-key", {
      debugId,
      hasApiKey: false,
      cvTextLength: cvText.length,
      hasAttachment: Boolean(attachment?.dataBase64),
    });
    logGeminiError("Thiếu GEMINI_API_KEY", { debugId });
    throw new AppError(
      "Chưa cấu hình GEMINI_API_KEY. Thêm khóa API vào file .env và khởi động lại server.",
      503,
    );
  }

  const { fullPrompt, meta: promptMeta } = buildCvEvaluationPrompt({
    cvText,
    settings,
  });

  const requestBody = {
    contents: [
      {
        parts: [
          { text: fullPrompt },
          ...(attachment?.dataBase64
            ? [
                {
                  inline_data: {
                    mime_type: attachment.mimeType || "application/pdf",
                    data: attachment.dataBase64,
                  },
                },
              ]
            : []),
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  };

  try {
    debugGemini("prompt-meta", {
      debugId,
      ...promptMeta,
      settingsSnapshot: {
        autoRejectEnabled: settings.autoRejectEnabled,
        autoPassEnabled: settings.autoPassEnabled,
        criteria: (settings.criteria || []).map((c) => ({
          name: c?.name,
          enabled: c?.enabled !== false,
        })),
      },
    });
    debugGemini("request", {
      debugId,
      model: GEMINI_MODEL,
      endpoint: GEMINI_ENDPOINT,
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      cvTextLength: cvText.length,
      cvTextPreview: truncateText(cvText),
      attachment: attachment
        ? {
            filename: attachment.filename || "",
            mimeType: attachment.mimeType || "",
            base64Length: String(attachment.dataBase64 || "").length,
          }
        : null,
      promptLength: fullPrompt.length,
      promptPreview: truncateText(fullPrompt),
    });

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const data = await response.json();
    debugGemini("response", {
      debugId,
      status: response.status,
      ok: response.ok,
      apiError: data?.error || null,
      rawOutputPreview: truncateText(
        data?.candidates?.[0]?.content?.parts
          ?.map((part) => part?.text || "")
          .join("\n"),
      ),
    });

    if (!response.ok || data.error) {
      const msg =
        data?.error?.message ||
        `Gemini trả lỗi HTTP ${response.status}`;
      logGeminiError("API trả lỗi", {
        debugId,
        httpStatus: response.status,
        apiError: data?.error || null,
      });
      throw new AppError(`Gemini API: ${msg}`, 502);
    }

    const rawText = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("\n");
    const jsonString = extractJsonString(rawText);
    debugGemini("parsed-json", {
      debugId,
      jsonStringPreview: truncateText(jsonString),
    });
    if (!jsonString) {
      logGeminiError("Không trích được JSON từ output", {
        debugId,
        rawPreview: truncateText(rawText || ""),
      });
      throw new AppError(
        "Gemini không trả về JSON hợp lệ. Kiểm tra model, prompt và bật GEMINI_DEBUG để xem raw output.",
        502,
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseErr) {
      logGeminiError("JSON.parse thất bại", {
        debugId,
        jsonPreview: truncateText(jsonString),
        parseMessage: parseErr?.message,
      });
      throw new AppError(
        "Không parse được JSON từ Gemini. Kiểm tra response (GEMINI_DEBUG).",
        502,
      );
    }

    const output = normalizeAnalysis(parsed, "Đã phân tích CV bằng Gemini.");
    debugGemini("normalized-output", {
      debugId,
      output,
    });
    return output;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    debugGemini("exception", {
      debugId,
      message: error?.message || "Unknown Gemini error",
      stack: truncateText(error?.stack || ""),
    });
    logGeminiError("Exception không mong đợi", {
      debugId,
      message: error?.message,
      stack: truncateText(error?.stack || ""),
    });
    throw new AppError(
      error?.message
        ? `Lỗi khi gọi Gemini: ${error.message}`
        : "Lỗi không xác định khi gọi Gemini.",
      502,
    );
  }
};

module.exports = { analyzeCvByGemini };
