export type CvItem = {
  id: string
  candidateName: string
  email: string
  score: number
  decision: "pass" | "reject"
  skills: string[]
  strengths: string[]
  weaknesses: string[]
  summary: string
}

export type Criterion = {
  id: string
  title: string
  description: string
  enabled: boolean
}
