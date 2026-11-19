import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ExecutiveDashboardPage } from './pages/ExecutiveDashboardPage';
import { WorkerExplorerPage } from './pages/WorkerExplorerPage';
import { ExposureRecordExplorerPage } from './pages/ExposureRecordExplorerPage';
import { AnalyticsLabPage } from './pages/AnalyticsLabPage';
import { ZoneAnalysisPage } from './pages/ZoneAnalysisPage';
import { AlertsPage } from './pages/AlertsPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { LoginPage } from './pages/LoginPage';
import { WorkerDashboardPage } from './pages/WorkerDashboardPage';
import { DashboardErrorBoundary } from './components/DashboardErrorBoundary';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminOverviewPage } from './pages/AdminOverviewPage';
import { AdminDetailsPage } from './pages/AdminDetailsPage';
import { useMemo } from 'react';

const RoleDashboard: React.FC = () => {
  const role = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('chromaguard_user') || '{}')?.role; } catch { return null; }
  }, []);
  return role === 'ROLE_WORKER' ? <WorkerDashboardPage /> : role === 'ROLE_ADMIN' ? <AdminOverviewPage /> : <ExecutiveDashboardPage />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardErrorBoundary><RoleDashboard /></DashboardErrorBoundary>} />
          <Route path="worker-details" element={<DashboardErrorBoundary><WorkerDashboardPage view="details" /></DashboardErrorBoundary>} />
          <Route path="worker-exposure" element={<DashboardErrorBoundary><WorkerDashboardPage view="exposure" /></DashboardErrorBoundary>} />
          <Route path="exposure-monitoring" element={<DashboardErrorBoundary><AdminDashboardPage /></DashboardErrorBoundary>} />
          <Route path="admin-details" element={<AdminDetailsPage />} />
          <Route path="workers" element={<WorkerExplorerPage />} />
          <Route path="records" element={<ExposureRecordExplorerPage />} />
          <Route path="analytics" element={<AnalyticsLabPage />} />
          <Route path="zones" element={<ZoneAnalysisPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="methodology" element={<MethodologyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};


export default App;
