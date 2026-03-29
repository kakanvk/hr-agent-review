import { useEffect, useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/components/theme-provider"
import { fetchCandidates } from "@/services/api"
import type { CandidateItem } from "@/pages/cv-warehouse/types"
import { CvDetailDialog } from "@/pages/cv-warehouse/_components/cv-detail-dialog"
import {
  calculateStats,
  calculateSkills,
  calculateScoreDistribution,
  calculatePassRate,
  calculateWeeklyData,
  calculateScoreTrend,
  type DashboardStats,
} from "@/utils/dashboard-calculator"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, Users, CheckCircle, AlertCircle } from "lucide-react"

export function DashboardPage() {
  const { theme } = useTheme()
  const isDark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [candidates, setCandidates] = useState<CandidateItem[]>([])
  const [selectedCv, setSelectedCv] = useState<CandidateItem | null>(null)
  const [isCvDialogOpen, setIsCvDialogOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    passed: 0,
    rejected: 0,
    averageScore: 0,
  })

  const chartColor = isDark ? "#e5e7eb" : "#1f2937"
  const gridColor = isDark ? "#374151" : "#e5e7eb"
  const primaryColor = "#3b82f6"
  const successColor = "#10b981"
  const warningColor = "#f59e0b"
  const dangerColor = "#ef4444"

  const weeklyData = useMemo(() => {
    return calculateWeeklyData(candidates)
  }, [candidates])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)
        setError("")
        const candidatesData = await fetchCandidates()
        setCandidates(candidatesData)
        const calculatedStats = calculateStats(candidatesData)
        setStats(calculatedStats)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải dữ liệu dashboard"
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadDashboardData()
  }, [])

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-destructive">{error}</CardContent>
      </Card>
    )
  }

  const statItems = [
    { label: "Tổng CV", value: stats.total.toString(), trend: `+${stats.total}` },
    {
      label: "Đủ điều kiện",
      value: stats.passed.toString(),
      trend: stats.total > 0 ? `${Math.round((stats.passed / stats.total) * 100)}%` : "0%",
    },
    {
      label: "Cần xem lại",
      value: stats.rejected.toString(),
      trend: stats.total > 0 ? `${Math.round((stats.rejected / stats.total) * 100)}%` : "0%",
    },
    { label: "Điểm trung bình", value: stats.averageScore.toString(), trend: "+0.0" },
  ]

  const skillsData = useMemo(() => {
    return calculateSkills(candidates)
  }, [candidates])

  const scoreDistributionData = useMemo(() => {
    return calculateScoreDistribution(candidates)
  }, [candidates])

  const passRateData = useMemo(() => {
    return calculatePassRate(candidates)
  }, [candidates])

  const scoreTrendData = useMemo(() => {
    return calculateScoreTrend(candidates)
  }, [candidates])

  const topCvData = useMemo(() => {
    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [candidates])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {statItems.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <div className="absolute right -top-8 opacity-5">
              {stat.label === "Tổng CV" && <Users size={80} />}
              {stat.label === "Đủ điều kiện" && <CheckCircle size={80} />}
              {stat.label === "Cần xem lại" && <AlertCircle size={80} />}
              {stat.label === "Điểm trung bình" && <TrendingUp size={80} />}
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">{stat.label}</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {isLoading ? "-" : stat.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={stat.trend.startsWith("+") || stat.trend.endsWith("%") ? "default" : "secondary"}>
                {isLoading ? "-" : stat.trend}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weekly/Daily Results */}
        <Card>
          <CardHeader>
            <CardTitle>{weeklyData.length > 0 && weeklyData[0].week.startsWith("W") ? "Kết quả hàng tuần" : "Kết quả hàng ngày"}</CardTitle>
            <CardDescription>Số lượng CV đủ điều kiện/cần xem lại/chờ xử lý</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">Đang tải...</div>
            ) : weeklyData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="week" stroke={chartColor} />
                  <YAxis stroke={chartColor} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#fff" }} />
                  <Legend />
                  <Bar dataKey="passed" stackId="a" fill={successColor} name="Đủ điều kiện" />
                  <Bar dataKey="rejected" stackId="a" fill={dangerColor} name="Cần xem lại" />
                  <Bar dataKey="pending" stackId="a" fill={warningColor} name="Chờ xử lý" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pass Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Tỷ lệ phê duyệt</CardTitle>
            <CardDescription>Phân bố CV đủ/cần xem lại</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">Đang tải...</div>
            ) : stats.total === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={passRateData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value, percent }) => {
                      const percentage = (isNaN(percent) || !percent) ? 0 : (percent * 100).toFixed(0)
                      return `${name}: ${value} (${percentage}%)`
                    }}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {passRateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle>{scoreTrendData.length > 0 && scoreTrendData[0].date.startsWith("CV") ? "Xu hướng theo từng CV" : "Xu hướng điểm số"}</CardTitle>
            <CardDescription>Điểm trung bình và trung vị theo thời gian</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">Đang tải...</div>
            ) : scoreTrendData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoreTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" stroke={chartColor} fontSize={12} />
                  <YAxis stroke={chartColor} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#fff" }} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke={primaryColor}
                    name="Trung bình"
                    strokeWidth={2}
                  />
                  <Line type="monotone" dataKey="median" stroke={successColor} name="Trung vị" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố điểm số</CardTitle>
            <CardDescription>Số lượng CV theo khoảng điểm</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">Đang tải...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="range" stroke={chartColor} />
                  <YAxis stroke={chartColor} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#fff" }} />
                  <Bar dataKey="count" fill={primaryColor} name="Số lượng" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Kỹ năng hàng đầu</CardTitle>
            <CardDescription>Kỹ năng xuất hiện nhiều nhất trong CV</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">Đang tải...</div>
            ) : skillsData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={skillsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis type="number" stroke={chartColor} />
                  <YAxis dataKey="skill" type="category" stroke={chartColor} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#fff" }} />
                  <Bar dataKey="count" fill={primaryColor} name="Số lượng" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 5 CVs */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 CV cao nhất</CardTitle>
            <CardDescription>5 ứng viên có điểm cao nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : topCvData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">Chưa có dữ liệu</div>
            ) : (
              <div className="space-y-2">
                {topCvData.map((cv, index) => (
                  <div
                    key={cv.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all hover:border-primary hover:bg-primary/5"
                    onClick={() => {
                      setSelectedCv(cv)
                      setIsCvDialogOpen(true)
                    }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                      #{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold">{cv.candidateName}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{cv.email}</p>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      <Badge
                        className={`text-xs font-semibold ${
                          cv.decision === "pass"
                            ? "bg-emerald-600 text-white dark:bg-emerald-600"
                            : "bg-rose-600 text-white dark:bg-rose-600"
                        }`}
                      >
                        {cv.decision === "pass" ? "Đạt" : "Loại"}
                      </Badge>
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{cv.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CvDetailDialog
        open={isCvDialogOpen}
        onOpenChange={setIsCvDialogOpen}
        candidate={selectedCv}
      />
    </div>
  )
}
