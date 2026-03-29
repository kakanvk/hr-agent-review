import { Navigate, Route, Routes } from "react-router-dom"

import { AUTH_KEY } from "@/constants/auth"
import { ProtectedLayout } from "@/layouts/protected-layout"
import { CampaignDetailPage } from "@/pages/campaigns/campaign-detail-page"
import { CampaignsPage } from "@/pages/campaigns/campaigns-page"
import { CvWarehousePage } from "@/pages/cv-warehouse"
import { DashboardPage } from "@/pages/dashboard-page"
import { EmailListPage } from "@/pages/email-list/email-list-page"
import { LoginPage } from "@/pages/login-page"
import { SettingsPage } from "@/pages/settings/settings-page"

function RequireAuth() {
  const isAuthenticated = Boolean(localStorage.getItem(AUTH_KEY))

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <ProtectedLayout />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/emails" element={<EmailListPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="/cv-warehouse" element={<CvWarehousePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
