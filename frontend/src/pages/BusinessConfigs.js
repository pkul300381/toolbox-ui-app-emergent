import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Settings, Edit, Trash2 } from 'lucide-react';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BusinessConfigs = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [formData, setFormData] = useState({
    config_type: 'mandatory_fields',
    key: '',
    value: '',
    description: '',
  });

  const configTypes = [
    { value: 'mandatory_fields', label: 'Mandatory Fields' },
    { value: 'product_types', label: 'Product Types' },
    { value: 'merchant_categories', label: 'Merchant Categories' },
    { value: 'merchant_services', label: 'Merchant Services' },
    { value: 'merchant_declines', label: 'Merchant Declines' },
    { value: 'transit_merchants', label: 'Transit Merchants' },
    { value: 'wallet_keystore', label: 'Wallet KeyStore' },
    { value: 'keystore', label: 'KeyStore' },
  ];

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await axios.get(`${API_BASE}/business-configs`);
      setConfigs(response.data);
    } catch (error) {
      toast.error('Failed to fetch configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editMode && selectedConfig) {
        await axios.put(`${API_BASE}/business-configs/${selectedConfig.id}`, formData);
        toast.success('Configuration updated successfully');
      } else {
        await axios.post(`${API_BASE}/business-configs`, formData);
        toast.success('Configuration created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchConfigs();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (config) => {
    setSelectedConfig(config);
    setEditMode(true);
    setFormData({
      config_type: config.config_type,
      key: config.key,
      value: typeof config.value === 'string' ? config.value : JSON.stringify(config.value),
      description: config.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (configId) => {
    try {
      await axios.delete(`${API_BASE}/business-configs/${configId}`);
      toast.success('Configuration deleted');
      fetchConfigs();
    } catch (error) {
      toast.error('Failed to delete configuration');
    }
  };

  const resetForm = () => {
    setFormData({
      config_type: 'mandatory_fields',
      key: '',
      value: '',
      description: '',
    });
    setEditMode(false);
    setSelectedConfig(null);
  };

  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.config_type]) {
      acc[config.config_type] = [];
    }
    acc[config.config_type].push(config);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Business Configurations</h1>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Manage business rules, merchant configurations, and system settings
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                data-testid="create-config-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Configuration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editMode ? 'Edit' : 'Create'} Configuration</DialogTitle>
                <DialogDescription>
                  {editMode ? 'Update' : 'Add a new'} business configuration setting.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="config-form">
                <div className="space-y-2">
                  <Label htmlFor="config_type">Configuration Type *</Label>
                  <Select
                    value={formData.config_type}
                    onValueChange={(value) => setFormData({ ...formData, config_type: value })}
                    disabled={editMode}
                  >
                    <SelectTrigger data-testid="config-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {configTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="key">Key *</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    required
                    placeholder="config_key"
                    data-testid="config-key-input"
                    disabled={editMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">Value *</Label>
                  <Textarea
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    placeholder="Configuration value or JSON"
                    rows={4}
                    data-testid="config-value-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    rows={2}
                    data-testid="config-description-input"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  data-testid="submit-config-button"
                >
                  {editMode ? 'Update' : 'Create'} Configuration
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : configs.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Settings className="h-16 w-16 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No Configurations
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
                Start by creating business configuration settings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedConfigs).map(([type, typeConfigs]) => (
              <Card key={type} className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white capitalize">
                    {configTypes.find(t => t.value === type)?.label || type}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {typeConfigs.map((config) => (
                      <div
                        key={config.id}
                        className="flex items-start justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        data-testid={`config-item-${config.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-slate-900 dark:text-white">{config.key}</h4>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 break-all">
                            {typeof config.value === 'string' ? config.value : JSON.stringify(config.value)}
                          </p>
                          {config.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                              {config.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(config)}
                            data-testid={`edit-config-${config.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(config.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            data-testid={`delete-config-${config.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
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

export default BusinessConfigs;
