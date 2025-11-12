import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';
import { GitBranch, GitCommit, Download, Upload, RefreshCw } from 'lucide-react';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const GitManagement = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchGitLogs();
    fetchGitStatus();
  }, []);

  const fetchGitLogs = async () => {
    try {
      const response = await axios.get(`${API_BASE}/git/log?limit=20`);
      setLogs(response.data.logs);
    } catch (error) {
      toast.error('Failed to fetch Git logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchGitStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/git/status`);
      setStatus(response.data.status || 'No changes');
    } catch (error) {
      console.error('Failed to fetch Git status:', error);
    }
  };

  const handlePush = async () => {
    setActionLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/git/push`);
      toast.success('Successfully pushed to remote');
      fetchGitStatus();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Push failed. Ensure remote is configured.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePull = async () => {
    setActionLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/git/pull`);
      toast.success('Successfully pulled from remote');
      fetchGitLogs();
      fetchGitStatus();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Pull failed. Ensure remote is configured.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchGitLogs();
    fetchGitStatus();
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Git Management</h1>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Version control and repository management for connection configurations
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={loading || actionLoading}
              data-testid="refresh-button"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handlePull}
              variant="outline"
              disabled={actionLoading}
              data-testid="pull-button"
            >
              <Download className="h-4 w-4 mr-2" />
              Pull
            </Button>
            <Button
              onClick={handlePush}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              disabled={actionLoading}
              data-testid="push-button"
            >
              <Upload className="h-4 w-4 mr-2" />
              Push
            </Button>
          </div>
        </div>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Repository Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
              <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {status || 'Loading status...'}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Commit History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <GitBranch className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No commits yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    data-testid={`git-commit-${index}`}
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0">
                      <GitCommit className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white mb-1">{log.message}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                        <span>{log.author}</span>
                        <span>{log.date}</span>
                      </div>
                      <code className="text-xs text-slate-500 dark:text-slate-500 mt-1 block">
                        {log.commit_hash.substring(0, 8)}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GitManagement;
