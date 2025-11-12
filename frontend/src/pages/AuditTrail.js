import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';
import { FileText, User, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuditTrail = () => {
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrails();
  }, []);

  const fetchTrails = async () => {
    try {
      const response = await axios.get(`${API_BASE}/audit-trail`);
      setTrails(response.data);
    } catch (error) {
      toast.error('Failed to fetch audit trail');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'updated':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
      case 'deleted':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';
      case 'rejected':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Audit Trail</h1>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Complete history of all system changes and activities
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trails.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No Audit Records
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
                Audit trail is empty. Actions will be logged here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {trails.map((trail, index) => (
              <Card
                key={trail.id}
                className="card-hover border-slate-200 dark:border-slate-800"
                style={{ animationDelay: `${index * 0.05}s` }}
                data-testid={`audit-record-${trail.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={cn('capitalize', getActionColor(trail.action))}>
                            {trail.action}
                          </Badge>
                          <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                            {trail.entity_type}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <User className="h-3.5 w-3.5" />
                            <span>{trail.username}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(trail.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AuditTrail;
