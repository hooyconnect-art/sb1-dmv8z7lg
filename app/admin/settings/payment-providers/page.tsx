'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentProvider {
  id: string;
  provider_name: string;
  provider_type: string;
  api_endpoint: string;
  api_key: string;
  api_secret: string;
  ussd_prefix: string;
  ussd_suffix: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function PaymentProvidersPage() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<PaymentProvider | null>(null);
  const [formData, setFormData] = useState({
    provider_name: '',
    provider_type: 'EVC',
    api_endpoint: '',
    api_key: '',
    api_secret: '',
    ussd_prefix: '*712*',
    ussd_suffix: '#',
    active: false
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/payment-providers');
      const data = await response.json();
      if (response.ok) {
        setProviders(data.providers || []);
      } else {
        toast.error(data.error || 'Failed to load providers');
      }
    } catch (error) {
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/admin/payment-providers';
      const method = editingProvider ? 'PUT' : 'POST';
      const body = editingProvider
        ? { id: editingProvider.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(editingProvider ? 'Provider updated' : 'Provider created');
        setIsDialogOpen(false);
        resetForm();
        fetchProviders();
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    try {
      const response = await fetch(`/api/admin/payment-providers?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Provider deleted');
        fetchProviders();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleToggleActive = async (provider: PaymentProvider) => {
    try {
      const response = await fetch('/api/admin/payment-providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: provider.id,
          active: !provider.active
        })
      });

      if (response.ok) {
        toast.success(provider.active ? 'Provider disabled' : 'Provider enabled');
        fetchProviders();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update');
      }
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleEdit = (provider: PaymentProvider) => {
    setEditingProvider(provider);
    setFormData({
      provider_name: provider.provider_name,
      provider_type: provider.provider_type,
      api_endpoint: provider.api_endpoint,
      api_key: provider.api_key,
      api_secret: provider.api_secret,
      ussd_prefix: provider.ussd_prefix,
      ussd_suffix: provider.ussd_suffix,
      active: provider.active
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProvider(null);
    setFormData({
      provider_name: '',
      provider_type: 'EVC',
      api_endpoint: '',
      api_key: '',
      api_secret: '',
      ussd_prefix: '*712*',
      ussd_suffix: '#',
      active: false
    });
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Payment Providers</h1>
            <p className="text-gray-600 mt-1">Manage EVC/Wallet API configurations</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProvider ? 'Edit Provider' : 'Add Payment Provider'}
                </DialogTitle>
                <DialogDescription>
                  Configure external EVC/Wallet API settings
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="provider_name">Provider Name</Label>
                    <Input
                      id="provider_name"
                      value={formData.provider_name}
                      onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                      placeholder="EVC Plus"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="provider_type">Provider Type</Label>
                    <Select
                      value={formData.provider_type}
                      onValueChange={(value) => setFormData({ ...formData, provider_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EVC">EVC</SelectItem>
                        <SelectItem value="Wallet">Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="api_endpoint">API Endpoint</Label>
                  <Input
                    id="api_endpoint"
                    type="url"
                    value={formData.api_endpoint}
                    onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                    placeholder="https://api.evcplus.so/v1/payment"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="api_key">API Key</Label>
                    <Input
                      id="api_key"
                      type="password"
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      placeholder={editingProvider ? "Leave blank to keep current" : "Enter API key"}
                      required={!editingProvider}
                    />
                  </div>
                  <div>
                    <Label htmlFor="api_secret">API Secret</Label>
                    <Input
                      id="api_secret"
                      type="password"
                      value={formData.api_secret}
                      onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                      placeholder={editingProvider ? "Leave blank to keep current" : "Enter API secret"}
                      required={!editingProvider}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ussd_prefix">USSD Prefix</Label>
                    <Input
                      id="ussd_prefix"
                      value={formData.ussd_prefix}
                      onChange={(e) => setFormData({ ...formData, ussd_prefix: e.target.value })}
                      placeholder="*712*"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ussd_suffix">USSD Suffix</Label>
                    <Input
                      id="ussd_suffix"
                      value={formData.ussd_suffix}
                      onChange={(e) => setFormData({ ...formData, ussd_suffix: e.target.value })}
                      placeholder="#"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    {editingProvider ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : providers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No payment providers configured</p>
              <p className="text-sm text-gray-400 mt-2">Add your first EVC/Wallet provider to enable payments</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {providers.map((provider) => (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {provider.provider_name}
                        <Badge variant={provider.active ? 'default' : 'secondary'}>
                          {provider.active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{provider.provider_type}</Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        USSD Format: {provider.ussd_prefix}WALLET_NUMBER*AMOUNT{provider.ussd_suffix}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(provider)}
                      >
                        {provider.active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(provider)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(provider.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">API Endpoint:</span> {provider.api_endpoint}
                    </div>
                    <div>
                      <span className="font-medium">API Key:</span> {provider.api_key}
                    </div>
                    <div>
                      <span className="font-medium">API Secret:</span> {provider.api_secret}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
