import type { CandidateItem } from "@/pages/cv-warehouse/types"

export interface DashboardStats {
  total: number
  passed: number
  rejected: number
  averageScore: number
}

export interface WeeklyData {
  week: string
  passed: number
  rejected: number
  pending: number
}

export interface SkillData {
  skill: string
  count: number
  percentage: number
}

export interface ScoreDistributionData {
  range: string
  count: number
  percentage: number
}

export interface PassRateData {
  name: string
  value: number
  fill: string
}

export interface ScoreTrendData {
  date: string
  average: number
  median: number
}

export interface DepartmentData {
  dept: string
  total: number
  passed: number
  rate: number
}

export function calculateStats(candidates: CandidateItem[]): DashboardStats {
  const total = candidates.length
  const passed = candidates.filter((c) => c.decision === "pass").length
  const rejected = total - passed
  const scores = candidates.map((c) => c.score)
  const averageScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0

  return {
    total,
    passed,
    rejected,
    averageScore,
  }
}

export function calculateSkills(candidates: CandidateItem[]): SkillData[] {
  const skillCount: Record<string, number> = {}

  candidates.forEach((candidate) => {
    candidate.skills.forEach((skill) => {
      skillCount[skill] = (skillCount[skill] || 0) + 1
    })
  })

  const total = Object.values(skillCount).reduce((a, b) => a + b, 0)
  return Object.entries(skillCount)
    .map(([skill, count]) => ({
      skill,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

export function calculateScoreDistribution(candidates: CandidateItem[]): ScoreDistributionData[] {
  const ranges = [
    { range: "80-100", min: 80, max: 100 },
    { range: "60-79", min: 60, max: 79 },
    { range: "40-59", min: 40, max: 59 },
    { range: "0-39", min: 0, max: 39 },
  ]

  const total = candidates.length

  return ranges.map(({ range, min, max }) => {
    const count = candidates.filter((c) => c.score >= min && c.score <= max).length
    return {
      range,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }
  })
}

export function calculatePassRate(candidates: CandidateItem[]): PassRateData[] {
  const passed = candidates.filter((c) => c.decision === "pass").length
  const rejected = candidates.length - passed

  return [
    { name: "Đủ điều kiện", value: passed, fill: "#10b981" },
    { name: "Cần xem lại", value: rejected, fill: "#f59e0b" },
  ]
}

export function calculateWeeklyData(candidates: CandidateItem[]): WeeklyData[] {
  if (candidates.length === 0) {
    return []
  }

  // Sort candidates by creation date
  const sortedCandidates = [...candidates].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  // Group by day
  const dayGroupMap: Record<string, { passed: number; rejected: number; pending: number }> = {}

  sortedCandidates.forEach((candidate) => {
    const date = new Date(candidate.createdAt)
    const dayKey = `${date.getDate()}/${date.getMonth() + 1}`

    if (!dayGroupMap[dayKey]) {
      dayGroupMap[dayKey] = { passed: 0, rejected: 0, pending: 0 }
    }

    if (candidate.decision === "pass") {
      dayGroupMap[dayKey].passed += 1
    } else {
      dayGroupMap[dayKey].rejected += 1
    }
  })

  let result = Object.entries(dayGroupMap)
    .map(([dayKey, data]) => ({
      week: `${dayKey}`,
      passed: data.passed,
      rejected: data.rejected,
      pending: data.pending,
    }))
    .sort((a, b) => {
      const aParts = a.week.split("/").map(Number)
      const bParts = b.week.split("/").map(Number)
      const aDate = new Date(2024, aParts[1] - 1, aParts[0])
      const bDate = new Date(2024, bParts[1] - 1, bParts[0])
      return aDate.getTime() - bDate.getTime()
    })

  // If only 1 day, generate 7 days with 0 for other days
  if (result.length === 1) {
    const [firstDayStr] = Object.keys(dayGroupMap)
    const [day, month] = firstDayStr.split("/").map(Number)
    const baseDate = new Date(2024, month - 1, day)

    const expandedResult: WeeklyData[] = []
    for (let i = -3; i <= 3; i++) {
      const newDate = new Date(baseDate)
      newDate.setDate(newDate.getDate() + i)
      const dateKey = `${newDate.getDate()}/${newDate.getMonth() + 1}`

      const data = dayGroupMap[dateKey]
      expandedResult.push({
        week: dateKey,
        passed: data?.passed ?? 0,
        rejected: data?.rejected ?? 0,
        pending: data?.pending ?? 0,
      })
    }

    return expandedResult
  }

  return result
}

export function calculateScoreTrend(candidates: CandidateItem[]): ScoreTrendData[] {
  if (candidates.length === 0) {
    return []
  }

  // Sort candidates by creation date
  const sortedCandidates = [...candidates].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  // Group candidates by date based on createdAt
  const dateGroupMap: Record<string, number[]> = {}

  sortedCandidates.forEach((candidate) => {
    const date = new Date(candidate.createdAt)
    const dateKey = `${date.getDate()}/${date.getMonth() + 1}`

    if (!dateGroupMap[dateKey]) {
      dateGroupMap[dateKey] = []
    }
    if (typeof candidate.score === "number" && !isNaN(candidate.score)) {
      dateGroupMap[dateKey].push(candidate.score)
    }
  })

  // Calculate average and median for each date
  const trendData = Object.entries(dateGroupMap)
    .filter(([, scores]) => scores.length > 0)
    .map(([dateKey, scores]) => {
      const sum = scores.reduce((a, b) => a + b, 0)
      const average = Math.round((sum / scores.length) * 10) / 10
      const sortedScores = [...scores].sort((a, b) => a - b)
      const median =
        sortedScores.length % 2 === 0
          ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
          : sortedScores[Math.floor(sortedScores.length / 2)]

      return {
        date: dateKey,
        average: isNaN(average) ? 0 : average,
        median: isNaN(median) ? 0 : Math.round(median * 10) / 10,
      }
    })
    .sort((a, b) => {
      // Sort by date (assuming DD/MM format, but converts for proper sorting)
      const aDateParts = a.date.split("/").map(Number)
      const bDateParts = b.date.split("/").map(Number)
      const aDate = new Date(2024, aDateParts[1] - 1, aDateParts[0])
      const bDate = new Date(2024, bDateParts[1] - 1, bDateParts[0])
      return aDate.getTime() - bDate.getTime()
    })

  // If only 1 data point, generate 7 days with 0 for other days
  if (trendData.length === 1) {
    const [firstDateStr] = Object.keys(dateGroupMap)
    const [day, month] = firstDateStr.split("/").map(Number)
    const baseDate = new Date(2024, month - 1, day)
    const actualData = trendData[0]

    const expandedResult: ScoreTrendData[] = []
    for (let i = -3; i <= 3; i++) {
      const newDate = new Date(baseDate)
      newDate.setDate(newDate.getDate() + i)
      const dateKey = `${newDate.getDate()}/${newDate.getMonth() + 1}`

      if (dateKey === actualData.date) {
        expandedResult.push(actualData)
      } else {
        expandedResult.push({
          date: dateKey,
          average: 0,
          median: 0,
        })
      }
    }

    return expandedResult
  }

  return trendData
}
