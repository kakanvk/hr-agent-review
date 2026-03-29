import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockStats } from "@/mocks/dashboard"

export function DashboardPage() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {mockStats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-0">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{stat.trend}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Phân bố kết quả theo tuần</CardTitle>
            <CardDescription>Biểu đồ mẫu cho pass/reject theo tuần</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 items-end gap-2">
              {[42, 56, 31, 68, 52, 74].map((height, index) => (
                <div key={height} className="space-y-1">
                  <div className="rounded-md bg-primary/20 p-1">
                    <div className="w-full rounded-sm bg-primary" style={{ height: `${height}px` }} />
                  </div>
                  <p className="text-center text-[11px] text-muted-foreground">T{index + 1}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top kỹ năng</CardTitle>
            <CardDescription>Kỹ năng xuất hiện nhiều nhất trong CV</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { skill: "TypeScript", count: 39 },
              { skill: "React", count: 34 },
              { skill: "Node.js", count: 28 },
              { skill: "SQL", count: 21 },
            ].map((item) => (
              <div key={item.skill} className="flex items-center justify-between rounded-md border px-3 py-2">
                <p>{item.skill}</p>
                <Badge variant="outline">{item.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
