import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Server, Network } from 'lucide-react';
import { cn } from '@/lib/utils';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AcquiringClients = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_node_id: '',
    client_port: '',
    client_ip_address: '',
    connection_type: 'client_listener',
    mti_supported: '',
    heartbeat_prompt_type: 'echo',
    heartbeat_interval: '30',
    switch_node_id: '',
    iso_format: 'ISO8583',
    format_version: '1987',
    endpoint_name: '',
    timeout_interval: '60',
  });

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await axios.get(`${API_BASE}/connections?client_type=acquiring`);
      setConnections(response.data);
    } catch (error) {
      toast.error('Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      client_type: 'acquiring',
      client_port: parseInt(formData.client_port),
      heartbeat_interval: parseInt(formData.heartbeat_interval),
      timeout_interval: parseInt(formData.timeout_interval),
      mti_supported: formData.mti_supported.split(',').map(m => m.trim()).filter(m => m),
      connector_nodes: [],
    };

    try {
      await axios.post(`${API_BASE}/connections`, payload);
      toast.success('Connection submitted for approval');
      setDialogOpen(false);
      setFormData({
        client_node_id: '',
        client_port: '',
        client_ip_address: '',
        connection_type: 'client_listener',
        mti_supported: '',
        heartbeat_prompt_type: 'echo',
        heartbeat_interval: '30',
        switch_node_id: '',
        iso_format: 'ISO8583',
        format_version: '1987',
        endpoint_name: '',
        timeout_interval: '60',
      });
      fetchConnections();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create connection');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Acquiring Clients</h1>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Manage acquiring client connections and configurations
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                data-testid="create-connection-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Connection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Acquiring Connection</DialogTitle>
                <DialogDescription>
                  Add a new acquiring client connection. Changes will require approval.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="connection-form">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_node_id">Client Node ID *</Label>
                    <Input
                      id="client_node_id"
                      value={formData.client_node_id}
                      onChange={(e) => setFormData({ ...formData, client_node_id: e.target.value })}
                      required
                      data-testid="client-node-id-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endpoint_name">Endpoint Name *</Label>
                    <Input
                      id="endpoint_name"
                      value={formData.endpoint_name}
                      onChange={(e) => setFormData({ ...formData, endpoint_name: e.target.value })}
                      required
                      data-testid="endpoint-name-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_ip_address">Client IP Address *</Label>
                    <Input
                      id="client_ip_address"
                      value={formData.client_ip_address}
                      onChange={(e) => setFormData({ ...formData, client_ip_address: e.target.value })}
                      required
                      placeholder="192.168.1.100"
                      data-testid="client-ip-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_port">Client Port *</Label>
                    <Input
                      id="client_port"
                      type="number"
                      value={formData.client_port}
                      onChange={(e) => setFormData({ ...formData, client_port: e.target.value })}
                      required
                      data-testid="client-port-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="connection_type">Connection Type *</Label>
                  <Select
                    value={formData.connection_type}
                    onValueChange={(value) => setFormData({ ...formData, connection_type: value })}
                  >
                    <SelectTrigger data-testid="connection-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client_listener">Client Listener (Switch Connects)</SelectItem>
                      <SelectItem value="client_connector">Client Connector (Switch Listens)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="switch_node_id">Switch Node ID *</Label>
                    <Input
                      id="switch_node_id"
                      value={formData.switch_node_id}
                      onChange={(e) => setFormData({ ...formData, switch_node_id: e.target.value })}
                      required
                      data-testid="switch-node-id-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mti_supported">MTI Supported (comma-separated)</Label>
                    <Input
                      id="mti_supported"
                      value={formData.mti_supported}
                      onChange={(e) => setFormData({ ...formData, mti_supported: e.target.value })}
                      placeholder="0100, 0200, 0400"
                      data-testid="mti-supported-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="heartbeat_prompt_type">Heartbeat Prompt Type *</Label>
                    <Input
                      id="heartbeat_prompt_type"
                      value={formData.heartbeat_prompt_type}
                      onChange={(e) => setFormData({ ...formData, heartbeat_prompt_type: e.target.value })}
                      required
                      data-testid="heartbeat-type-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heartbeat_interval">Heartbeat Interval (seconds) *</Label>
                    <Input
                      id="heartbeat_interval"
                      type="number"
                      value={formData.heartbeat_interval}
                      onChange={(e) => setFormData({ ...formData, heartbeat_interval: e.target.value })}
                      required
                      data-testid="heartbeat-interval-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="iso_format">ISO Format *</Label>
                    <Input
                      id="iso_format"
                      value={formData.iso_format}
                      onChange={(e) => setFormData({ ...formData, iso_format: e.target.value })}
                      required
                      data-testid="iso-format-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="format_version">Format Version *</Label>
                    <Input
                      id="format_version"
                      value={formData.format_version}
                      onChange={(e) => setFormData({ ...formData, format_version: e.target.value })}
                      required
                      data-testid="format-version-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeout_interval">Timeout (seconds) *</Label>
                    <Input
                      id="timeout_interval"
                      type="number"
                      value={formData.timeout_interval}
                      onChange={(e) => setFormData({ ...formData, timeout_interval: e.target.value })}
                      required
                      data-testid="timeout-interval-input"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  data-testid="submit-connection-button"
                >
                  Create Connection
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : connections.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Server className="h-16 w-16 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No Acquiring Connections
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
                Get started by creating your first acquiring client connection.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {connections.map((conn) => (
              <Card
                key={conn.id}
                className="card-hover border-slate-200 dark:border-slate-800"
                data-testid={`connection-card-${conn.client_node_id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                        <Network className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-slate-900 dark:text-white">
                          {conn.client_node_id}
                        </CardTitle>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {conn.endpoint_name}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={cn('capitalize', getStatusColor(conn.connection_status))}
                      data-testid={`connection-status-${conn.client_node_id}`}
                    >
                      {conn.connection_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">IP Address:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {conn.client_ip_address}:{conn.client_port}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Switch Node:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {conn.switch_node_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Connection Type:</span>
                      <span className="font-medium text-slate-900 dark:text-white capitalize">
                        {conn.connection_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Heartbeat:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {conn.heartbeat_interval}s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">ISO Format:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {conn.iso_format} {conn.format_version}
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

export default AcquiringClients;
