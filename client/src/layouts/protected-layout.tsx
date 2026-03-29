import { useMemo, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"

import { AUTH_KEY, AUTH_USER_KEY } from "@/constants/auth"
import { menuItems } from "@/constants/menu"
import { ModeToggle } from "@/components/mode-toggle"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ProtectedLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const activeLabel = useMemo(() => {
    return menuItems.find((item) => location.pathname.startsWith(item.path))?.label ?? "Dashboard"
  }, [location.pathname])
  const userInfo = useMemo(() => {
    const fallback = { name: "Người dùng", email: "Chưa có email", avatar: "" }
    const raw = localStorage.getItem(AUTH_USER_KEY)
    if (!raw) {
      return fallback
    }

    try {
      const parsed = JSON.parse(raw) as { name?: string; email?: string; avatar?: string }
      return {
        name: parsed.name || fallback.name,
        email: parsed.email || fallback.email,
        avatar: parsed.avatar || "",
      }
    } catch {
      return fallback
    }
  }, [])
  const avatarFallback = useMemo(() => {
    return userInfo.name.trim().charAt(0).toUpperCase() || "U"
  }, [userInfo.name])

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    navigate("/login")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <aside
        className={`border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200 ${isSidebarCollapsed ? "w-16" : "w-72"
          }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
            {!isSidebarCollapsed && (
              <div>
                <p className="font-bold text-lg">HR Agent</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="rounded-md border border-sidebar-border p-1.5 hover:bg-sidebar-accent"
              aria-label={isSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
          </div>

          <nav className="space-y-1 p-3">
            {menuItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"
                  } ${isSidebarCollapsed ? "justify-center" : "gap-3"}`
                }
              >
                <Icon className="size-4 shrink-0" />
                {!isSidebarCollapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b bg-background/80 h-14 px-4 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">{activeLabel}</h1>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition hover:bg-accent hover:text-accent-foreground"
                  >
                    {userInfo.avatar ? (
                      <img src={userInfo.avatar} alt={userInfo.name} className="size-7 rounded-full object-cover" />
                    ) : (
                      <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {avatarFallback}
                      </span>
                    )}
                    <span className="max-w-48 truncate text-sm text-muted-foreground">{userInfo.email}</span>
                    <ChevronDown className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-2">
                  <div className="rounded-md p-2">
                    <p className="text-sm font-medium">{userInfo.name}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{userInfo.email}</p>
                  </div>
                  <hr className="my-2 border-border" />
                  <DropdownMenuItem className="mt-2 cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 size-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
