import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TrainingsPage } from './pages/TrainingsPage';
import { ToolboxTalksPage } from './pages/ToolboxTalksPage';
import { CertificationsPage } from './pages/CertificationsPage';
import { TrainingManagementPage } from './pages/TrainingManagementPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { ReportsAnalyticsPage } from './pages/ReportsAnalyticsPage';

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

const ADMIN_ROLES = ['platform_admin', 'hse_manager', 'supervisor'];

/** Admin-only route guard; non-admins are redirected to the dashboard. */
function AdminProtected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!ADMIN_ROLES.includes(user.role)) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/trainings"
        element={
          <Protected>
            <TrainingsPage />
          </Protected>
        }
      />
      <Route
        path="/toolbox-talks"
        element={
          <Protected>
            <ToolboxTalksPage />
          </Protected>
        }
      />
      <Route
        path="/certifications"
        element={
          <Protected>
            <CertificationsPage />
          </Protected>
        }
      />
      <Route
        path="/admin/trainings"
        element={
          <AdminProtected>
            <TrainingManagementPage />
          </AdminProtected>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminProtected>
            <UserManagementPage />
          </AdminProtected>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AdminProtected>
            <ReportsAnalyticsPage />
          </AdminProtected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
