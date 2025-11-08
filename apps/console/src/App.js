import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Product Console - Main Application
 *
 * Multi-tenant SaaS dashboard with real-time metrics and team management
 */
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
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(BrowserRouter, { children: _jsx(AppRoutes, {}) }) }));
}
function AppRoutes() {
    const { isAuthenticated, user } = useAuthStore();
    if (!isAuthenticated) {
        return _jsx(Login, {});
    }
    return (_jsx(Layout, { user: user, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/usage", element: _jsx(UsageMetrics, {}) }), _jsx(Route, { path: "/team", element: _jsx(TeamManagement, {}) }), _jsx(Route, { path: "/api-keys", element: _jsx(ApiKeys, {}) }), _jsx(Route, { path: "/billing", element: _jsx(Billing, {}) }), _jsx(Route, { path: "/settings", element: _jsx(Settings, {}) }), _jsx(Route, { path: "/login", element: _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "*", element: _jsx(NotFound, {}) })] }) }));
}
export default App;
//# sourceMappingURL=App.js.map