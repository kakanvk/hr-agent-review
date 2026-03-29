import type { CandidateItem } from "./types"

export function mapCandidate(item: Record<string, unknown>): CandidateItem {
  return {
    id: String(item._id ?? ""),
    candidateName: String(item.name ?? "Chưa rõ tên"),
    email: String(item.email ?? ""),
    score: Number(item.score ?? 0),
    decision: item.decision === "pass" ? "pass" : "reject",
    skills: Array.isArray(item.skills) ? item.skills.map((value) => String(value)) : [],
    strengths: Array.isArray(item.strengths) ? item.strengths.map((value) => String(value)) : [],
    weaknesses: Array.isArray(item.weaknesses) ? item.weaknesses.map((value) => String(value)) : [],
    summary: String(item.reason ?? ""),
    rawCvText: String(item.raw_cv_text ?? ""),
    sourceAttachmentName: String(item.source_attachment_name ?? ""),
    sourceFileUrl: String(item.source_file_url ?? ""),
    sourceFileMimeType: String(item.source_file_mime_type ?? ""),
  }
}
