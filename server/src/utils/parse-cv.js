const parseCv = async ({ rawText = "", snippet = "" }) => {
  // Placeholder for PDF extraction flow (pdf-parse) in the next phase.
  if (rawText?.trim()) {
    return rawText.trim();
  }

  return snippet?.trim() || "";
};

module.exports = { parseCv };
