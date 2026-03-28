const fs = require("node:fs");
const path = require("node:path");

const PROMPT_FILE = path.join(__dirname, "cv-evaluation.md");
const CV_TEXT_MAX = 16000;

let cachedTemplate = null;

const loadTemplate = () => {
  if (process.env.GEMINI_PROMPT_HOT_RELOAD === "true") {
    return fs.readFileSync(PROMPT_FILE, "utf8");
  }
  if (cachedTemplate === null) {
    cachedTemplate = fs.readFileSync(PROMPT_FILE, "utf8");
  }
  return cachedTemplate;
};

/**
 * Cho phép reload file .md khi debug (nodemon / chỉnh sửa tay).
 * Gọi `clearCvPromptCache()` sau khi sửa prompt không cần restart nếu gọi hàm này trước request tiếp theo.
 */
const clearCvPromptCache = () => {
  cachedTemplate = null;
};

const formatSettingsSummary = (settings = {}) => {
  const autoReject =
    typeof settings.autoRejectEnabled === "boolean"
      ? settings.autoRejectEnabled
      : true;
  const autoPass =
    typeof settings.autoPassEnabled === "boolean"
      ? settings.autoPassEnabled
      : false;

  return [
    '- **Ngôn ngữ:** JSON phải dùng tiếng Việt có dấu cho `reason`, `strengths`, `weaknesses` (xem mục "Ngôn ngữ đầu ra" trong prompt).',
    `- Tự động loại khi điểm thấp (autoReject): ${autoReject ? "bật" : "tắt"}`,
    `- Tự động đạt khi đủ điều kiện (autoPass): ${autoPass ? "bật" : "tắt"}`,
    "- Backend vẫn có thể áp rule điểm sàn sau phản hồi của bạn; hãy chấm điểm khách quan theo CV và tiêu chí.",
  ].join("\n");
};

const formatCriteriaList = (criteria = []) => {
  const enabled = Array.isArray(criteria)
    ? criteria.filter((item) => item?.enabled !== false)
    : [];

  if (enabled.length === 0) {
    return "_(Không có tiêu chí tùy chỉnh nào đang bật — đánh giá theo năng lực chung thể hiện trên CV.)_";
  }

  return enabled
    .map(
      (item, index) =>
        `${index + 1}. **${item.name}**: ${item.description}`,
    )
    .join("\n");
};

const formatCvTextBlock = (cvText = "") => {
  const trimmed = String(cvText || "").trim();
  if (!trimmed) {
    return "_(Không có đoạn text CV kèm request — nếu có file ảnh/PDF trong request, hãy dựa vào nội dung file để đánh giá.)_";
  }

  return trimmed.slice(0, CV_TEXT_MAX);
};

/**
 * @param {{ cvText?: string, settings?: { criteria?: Array, autoRejectEnabled?: boolean, autoPassEnabled?: boolean } }} params
 * @returns {{ fullPrompt: string, meta: object }}
 */
const buildCvEvaluationPrompt = ({ cvText = "", settings = {} }) => {
  const template = loadTemplate();
  const criteria = settings.criteria || [];

  const settingsSummary = formatSettingsSummary(settings);
  const criteriaList = formatCriteriaList(criteria);
  const cvBlock = formatCvTextBlock(cvText);

  const fullPrompt = template
    .replace("{{SETTINGS_SUMMARY}}", settingsSummary)
    .replace("{{CRITERIA_LIST}}", criteriaList)
    .replace("{{CV_TEXT}}", cvBlock);

  return {
    fullPrompt,
    meta: {
      promptFile: PROMPT_FILE,
      criteriaEnabledCount: criteria.filter((c) => c?.enabled !== false).length,
      criteriaTotalCount: Array.isArray(criteria) ? criteria.length : 0,
      cvTextLength: String(cvText || "").length,
      cvTextIncludedLength: cvBlock.length,
    },
  };
};

module.exports = {
  buildCvEvaluationPrompt,
  clearCvPromptCache,
  PROMPT_FILE,
};
