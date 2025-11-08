import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Console Dashboard - Overview page with key metrics
 */
import { useQuery } from '@tanstack/react-query';
import { MetricCard } from '../components/MetricCard';
import { UsageChart } from '../components/UsageChart';
import { ActivityFeed } from '../components/ActivityFeed';
import { QuickActions } from '../components/QuickActions';
import { apiClient } from '../lib/api-client';
export function Dashboard() {
    // Fetch dashboard metrics
    const { data: metrics, isLoading } = useQuery({
        queryKey: ['dashboard-metrics'],
        queryFn: async () => {
            const response = await apiClient.get('/dashboard/metrics');
            return response.data;
        }
    });
    // Fetch recent activity
    const { data: activity } = useQuery({
        queryKey: ['recent-activity'],
        queryFn: async () => {
            const response = await apiClient.get('/activity');
            return response.data;
        }
    });
    if (isLoading) {
        return _jsx(DashboardSkeleton, {});
    }
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Dashboard" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Overview of your platform usage and activity" })] }), _jsx(QuickActions, {}), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(MetricCard, { title: "API Calls", value: (metrics?.apiCalls || 0).toLocaleString(), change: metrics?.apiCallsChange || 0, trend: "up", icon: "\uD83D\uDCCA" }), _jsx(MetricCard, { title: "Active Users", value: (metrics?.activeUsers || 0).toLocaleString(), change: metrics?.activeUsersChange || 0, trend: "up", icon: "\uD83D\uDC65" }), _jsx(MetricCard, { title: "Uptime", value: `${metrics?.uptime || 99.9}%`, change: metrics?.uptimeChange || 0, trend: "stable", icon: "\u2705" }), _jsx(MetricCard, { title: "Response Time", value: `${metrics?.responseTime || 100}ms`, change: metrics?.responseTimeChange || 0, trend: "down", icon: "\u26A1" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Usage Trends" }), _jsx(UsageChart, { data: metrics?.usageData || [] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Recent Activity" }), _jsx(ActivityFeed, { activities: activity || [] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "System Status" }), _jsx(SystemStatus, { status: metrics?.systemStatus || {} })] })] })] }));
}
function SystemStatus({ status }) {
    const services = [
        { name: 'API Gateway', status: status.api, uptime: '99.99%' },
        { name: 'Database', status: status.database, uptime: '99.95%' },
        { name: 'Cache', status: status.cache, uptime: '100%' },
        { name: 'Search', status: status.search, uptime: '99.9%' }
    ];
    return (_jsx("div", { className: "space-y-3", children: services.map((service) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${service.status === 'operational'
                                ? 'bg-green-500'
                                : service.status === 'degraded'
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'}` }), _jsx("span", { className: "font-medium", children: service.name })] }), _jsx("span", { className: "text-sm text-gray-600", children: service.uptime })] }, service.name))) }));
}
function DashboardSkeleton() {
    return (_jsxs("div", { className: "space-y-8 animate-pulse", children: [_jsx("div", { className: "h-20 bg-gray-200 rounded" }), _jsx("div", { className: "grid grid-cols-4 gap-6", children: [1, 2, 3, 4].map((i) => (_jsx("div", { className: "h-32 bg-gray-200 rounded" }, i))) }), _jsx("div", { className: "h-96 bg-gray-200 rounded" })] }));
}
export default Dashboard;
//# sourceMappingURL=Dashboard.js.map