import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Gauge, Trash2 } from 'lucide-react';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Thresholds = () => {
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    metric: '',
    threshold_value: '',
    comparison: 'gt',
    entity_type: 'connection',
  });

  useEffect(() => {
    fetchThresholds();
  }, []);

  const fetchThresholds = async () => {
    try {
      const response = await axios.get(`${API_BASE}/thresholds`);
      setThresholds(response.data);
    } catch (error) {
      toast.error('Failed to fetch thresholds');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      threshold_value: parseFloat(formData.threshold_value),
    };

    try {
      await axios.post(`${API_BASE}/thresholds`, payload);
      toast.success('Threshold created successfully');
      setDialogOpen(false);
      setFormData({
        name: '',
        metric: '',
        threshold_value: '',
        comparison: 'gt',
        entity_type: 'connection',
      });
      fetchThresholds();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create threshold');
    }
  };

  const handleDelete = async (thresholdId) => {
    try {
      await axios.delete(`${API_BASE}/thresholds/${thresholdId}`);
      toast.success('Threshold deleted');
      fetchThresholds();
    } catch (error) {
      toast.error('Failed to delete threshold');
    }
  };

  const getComparisonLabel = (comparison) => {
    switch (comparison) {
      case 'gt':
        return 'Greater than';
      case 'lt':
        return 'Less than';
      case 'eq':
        return 'Equal to';
      case 'gte':
        return 'Greater than or equal';
      case 'lte':
        return 'Less than or equal';
      default:
        return comparison;
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Thresholds</h1>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Configure monitoring thresholds for alerts and notifications
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                data-testid="create-threshold-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Threshold
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Threshold</DialogTitle>
                <DialogDescription>
                  Define a new monitoring threshold for system alerts.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="threshold-form">
                <div className="space-y-2">
                  <Label htmlFor="name">Threshold Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="High Response Time"
                    data-testid="threshold-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metric">Metric *</Label>
                  <Input
                    id="metric"
                    value={formData.metric}
                    onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                    required
                    placeholder="response_time_ms"
                    data-testid="threshold-metric-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="comparison">Comparison *</Label>
                    <Select
                      value={formData.comparison}
                      onValueChange={(value) => setFormData({ ...formData, comparison: value })}
                    >
                      <SelectTrigger data-testid="threshold-comparison-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gt">Greater than (&gt;)</SelectItem>
                        <SelectItem value="lt">Less than (&lt;)</SelectItem>
                        <SelectItem value="eq">Equal to (=)</SelectItem>
                        <SelectItem value="gte">Greater than or equal (&gt;=)</SelectItem>
                        <SelectItem value="lte">Less than or equal (&lt;=)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threshold_value">Value *</Label>
                    <Input
                      id="threshold_value"
                      type="number"
                      step="any"
                      value={formData.threshold_value}
                      onChange={(e) => setFormData({ ...formData, threshold_value: e.target.value })}
                      required
                      data-testid="threshold-value-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entity_type">Entity Type *</Label>
                  <Select
                    value={formData.entity_type}
                    onValueChange={(value) => setFormData({ ...formData, entity_type: value })}
                  >
                    <SelectTrigger data-testid="threshold-entity-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="connection">Connection</SelectItem>
                      <SelectItem value="transaction">Transaction</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  data-testid="submit-threshold-button"
                >
                  Create Threshold
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : thresholds.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Gauge className="h-16 w-16 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No Thresholds Configured
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
                Create thresholds to monitor system metrics and receive alerts.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {thresholds.map((threshold) => (
              <Card
                key={threshold.id}
                className="card-hover border-slate-200 dark:border-slate-800"
                data-testid={`threshold-card-${threshold.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                        <Gauge className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-slate-900 dark:text-white text-base truncate">
                          {threshold.name}
                        </CardTitle>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(threshold.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      data-testid={`delete-threshold-${threshold.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Metric:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{threshold.metric}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Condition:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {getComparisonLabel(threshold.comparison)} {threshold.threshold_value}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Entity:</span>
                      <span className="font-medium text-slate-900 dark:text-white capitalize">
                        {threshold.entity_type}
                      </span>
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

export default Thresholds;
