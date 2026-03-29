export type CandidateItem = {
  id: string
  candidateName: string
  email: string
  score: number
  decision: "pass" | "reject"
  skills: string[]
  strengths: string[]
  weaknesses: string[]
  summary: string
  rawCvText: string
  sourceAttachmentName: string
  sourceFileUrl: string
  sourceFileMimeType: string
  createdAt: string
}
