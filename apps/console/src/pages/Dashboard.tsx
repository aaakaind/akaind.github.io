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
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your platform usage and activity
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="API Calls"
          value={((metrics as any)?.apiCalls || 0).toLocaleString()}
          change={(metrics as any)?.apiCallsChange || 0}
          trend="up"
          icon="📊"
        />
        <MetricCard
          title="Active Users"
          value={((metrics as any)?.activeUsers || 0).toLocaleString()}
          change={(metrics as any)?.activeUsersChange || 0}
          trend="up"
          icon="👥"
        />
        <MetricCard
          title="Uptime"
          value={`${(metrics as any)?.uptime || 99.9}%`}
          change={(metrics as any)?.uptimeChange || 0}
          trend="stable"
          icon="✅"
        />
        <MetricCard
          title="Response Time"
          value={`${(metrics as any)?.responseTime || 100}ms`}
          change={(metrics as any)?.responseTimeChange || 0}
          trend="down"
          icon="⚡"
        />
      </div>

      {/* Usage Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Usage Trends</h2>
        <UsageChart data={(metrics as any)?.usageData || []} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <ActivityFeed activities={activity || []} />
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <SystemStatus status={(metrics as any)?.systemStatus || {}} />
        </div>
      </div>
    </div>
  );
}

function SystemStatus({ status }: { status: any }) {
  const services = [
    { name: 'API Gateway', status: status.api, uptime: '99.99%' },
    { name: 'Database', status: status.database, uptime: '99.95%' },
    { name: 'Cache', status: status.cache, uptime: '100%' },
    { name: 'Search', status: status.search, uptime: '99.9%' }
  ];

  return (
    <div className="space-y-3">
      {services.map((service) => (
        <div
          key={service.name}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                service.status === 'operational'
                  ? 'bg-green-500'
                  : service.status === 'degraded'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
            />
            <span className="font-medium">{service.name}</span>
          </div>
          <span className="text-sm text-gray-600">{service.uptime}</span>
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-20 bg-gray-200 rounded" />
      <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 rounded" />
    </div>
  );
}

export default Dashboard;
