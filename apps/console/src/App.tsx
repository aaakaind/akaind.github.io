/**
 * Product Console - Main Application
 * 
 * Multi-tenant SaaS dashboard with real-time metrics and team management
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/auth';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { UsageMetrics } from './pages/UsageMetrics';
import { TeamManagement } from './pages/TeamManagement';
import { ApiKeys } from './pages/ApiKeys';
import { Billing } from './pages/Billing';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 30000,
      refetchOnWindowFocus: false
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout user={user!}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/usage" element={<UsageMetrics />} />
        <Route path="/team" element={<TeamManagement />} />
        <Route path="/api-keys" element={<ApiKeys />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;
