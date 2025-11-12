import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { Activity, Server, AlertCircle, GitBranch, Users, CheckCircle } from 'lucide-react';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Connections',
      value: stats?.total_connections || 0,
      icon: Server,
      color: 'from-blue-500 to-cyan-500',
      testId: 'stat-total-connections',
    },
    {
      title: 'Active Connections',
      value: stats?.active_connections || 0,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      testId: 'stat-active-connections',
    },
    {
      title: 'Pending Changes',
      value: stats?.pending_changes || 0,
      icon: Activity,
      color: 'from-amber-500 to-orange-500',
      testId: 'stat-pending-changes',
    },
    {
      title: 'Unresolved Alerts',
      value: stats?.unresolved_alerts || 0,
      icon: AlertCircle,
      color: 'from-red-500 to-pink-500',
      testId: 'stat-unresolved-alerts',
    },
    {
      title: 'Acquiring Clients',
      value: stats?.acquiring_count || 0,
      icon: Users,
      color: 'from-purple-500 to-indigo-500',
      testId: 'stat-acquiring-clients',
    },
    {
      title: 'Issuing Clients',
      value: stats?.issuing_count || 0,
      icon: GitBranch,
      color: 'from-pink-500 to-rose-500',
      testId: 'stat-issuing-clients',
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Dashboard</h1>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Overview of your network scheme connections and system health
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <Card
              key={stat.title}
              className="card-hover border-slate-200 dark:border-slate-800 overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
              data-testid={stat.testId}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">Database</span>
                  <span className="status-badge status-active">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">API Server</span>
                  <span className="status-badge status-active">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">Git Repository</span>
                  <span className="status-badge status-active">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 dark:text-slate-400">Connection Health</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {stats?.total_connections > 0
                        ? Math.round((stats.active_connections / stats.total_connections) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                      style={{
                        width: `${stats?.total_connections > 0 ? (stats.active_connections / stats.total_connections) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    System is operating normally. All connections are being monitored.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
