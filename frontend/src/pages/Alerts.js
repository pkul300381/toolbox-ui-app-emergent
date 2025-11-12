import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unresolved');

  useEffect(() => {
    fetchAlerts();
  }, [activeTab]);

  const fetchAlerts = async () => {
    try {
      const isResolved = activeTab === 'resolved';
      const response = await axios.get(`${API_BASE}/alerts?is_resolved=${isResolved}`);
      setAlerts(response.data);
    } catch (error) {
      toast.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await axios.post(`${API_BASE}/alerts/${alertId}/resolve`);
      toast.success('Alert resolved');
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return AlertCircle;
      case 'medium':
        return AlertTriangle;
      default:
        return AlertCircle;
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Alerts</h1>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Monitor system alerts and connection status notifications
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="unresolved" data-testid="unresolved-tab">
              Unresolved
            </TabsTrigger>
            <TabsTrigger value="resolved" data-testid="resolved-tab">
              Resolved
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : alerts.length === 0 ? (
              <Card className="border-slate-200 dark:border-slate-800">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  {activeTab === 'unresolved' ? (
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  ) : (
                    <AlertCircle className="h-16 w-16 text-slate-400 mb-4" />
                  )}
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {activeTab === 'unresolved' ? 'No Unresolved Alerts' : 'No Resolved Alerts'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
                    {activeTab === 'unresolved'
                      ? 'All alerts have been resolved. System is healthy.'
                      : 'No alerts have been resolved yet.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => {
                  const SeverityIcon = getSeverityIcon(alert.severity);
                  return (
                    <Card
                      key={alert.id}
                      className="card-hover border-slate-200 dark:border-slate-800"
                      data-testid={`alert-${alert.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              className={cn(
                                'p-2 rounded-lg',
                                alert.severity === 'critical' || alert.severity === 'high'
                                  ? 'bg-gradient-to-br from-red-500 to-orange-600'
                                  : 'bg-gradient-to-br from-yellow-500 to-amber-600'
                              )}
                            >
                              <SeverityIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-slate-900 dark:text-white">
                                  {alert.alert_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </CardTitle>
                                <Badge className={cn('capitalize', getSeverityColor(alert.severity))}>
                                  {alert.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{alert.message}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                                {new Date(alert.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {!alert.is_resolved && (
                            <Button
                              size="sm"
                              onClick={() => handleResolve(alert.id)}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                              data-testid={`resolve-alert-${alert.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Alerts;
