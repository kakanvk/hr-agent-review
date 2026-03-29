import { useEffect } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { API_BASE_URL, AUTH_KEY, AUTH_USER_KEY } from "@/constants/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")
    const email = searchParams.get("email")
    const name = searchParams.get("name")
    const avatar = searchParams.get("avatar")

    if (!token) {
      return
    }

    localStorage.setItem(AUTH_KEY, token)
    localStorage.setItem(
      AUTH_USER_KEY,
      JSON.stringify({
        email: email ?? "",
        name: name ?? "",
        avatar: avatar ?? "",
      }),
    )
    navigate("/dashboard", { replace: true })
  }, [navigate, searchParams])

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google/login`
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500/10 via-background to-cyan-500/10 p-4">
      <div className="pointer-events-none absolute -top-28 right-[-6rem] h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-[-7rem] h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />

      <Card className="w-full max-w-md border-border/70 bg-card/90 shadow-2xl backdrop-blur">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            HR Agent Workspace
          </div>
          <CardTitle className="text-2xl">Đăng nhập hệ thống</CardTitle>
          <CardDescription>Sử dụng tài khoản Google để truy cập AI HR Screening Agent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-between p-4 px-5" size="lg" onClick={handleGoogleLogin}>
            Tiếp tục với Google
            <ArrowRight className="size-4" />
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Bằng việc đăng nhập, bạn đồng ý cấp quyền email/profile cho hệ thống.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
