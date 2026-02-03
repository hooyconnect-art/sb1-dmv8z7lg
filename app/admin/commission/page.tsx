'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CommissionSetting {
  id: string;
  property_type: string;
  commission_rate: number;
  is_active: boolean;
  description: string;
  updated_at: string;
}

export default function CommissionPage() {
  const [settings, setSettings] = useState<CommissionSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_settings')
        .select('*')
        .order('property_type');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching commission settings:', error);
      toast.error('Failed to load commission settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (setting: CommissionSetting) => {
    setSaving(setting.id);
    try {
      const { error } = await supabase
        .from('commission_settings')
        .update({
          commission_rate: setting.commission_rate,
          description: setting.description,
          is_active: setting.is_active,
        })
        .eq('id', setting.id);

      if (error) throw error;

      toast.success('Commission rate updated successfully');
      fetchSettings();
    } catch (error: any) {
      console.error('Error updating commission:', error);
      toast.error(error.message || 'Failed to update commission rate');
    } finally {
      setSaving(null);
    }
  };

  const updateSetting = (id: string, field: keyof CommissionSetting, value: any) => {
    setSettings(prev => prev.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-brand-green" />
            Commission Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure commission rates for different property types. These rates are automatically applied to confirmed bookings and sales.
          </p>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Commission System Rules</p>
                <ul className="text-sm text-blue-800 mt-2 space-y-2 list-disc list-inside">
                  <li><strong>Hotel (15%):</strong> Auto-calculated commission per confirmed booking. Online booking and payment enabled.</li>
                  <li><strong>Fully Furnished (12%):</strong> Auto-calculated commission per confirmed booking. Online booking and payment enabled.</li>
                  <li><strong>Rental (0%):</strong> Inquiry-based only. No online booking, payment, or automatic commission. Manual handling required.</li>
                  <li><strong>Property for Sale:</strong> Custom commission configured manually per transaction.</li>
                </ul>
                <p className="text-sm text-blue-700 mt-3 font-medium">
                  Note: Only Hotel and Fully Furnished properties appear in payment and commission analytics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {settings.map((setting) => (
              <Card key={setting.id} className="border-border shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-brand-navy">
                        {setting.property_type}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Last updated: {new Date(setting.updated_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={setting.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {setting.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`rate-${setting.id}`}>Commission Rate (%)</Label>
                      <Input
                        id={`rate-${setting.id}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={setting.commission_rate}
                        onChange={(e) => updateSetting(setting.id, 'commission_rate', parseFloat(e.target.value) || 0)}
                        className="mt-2"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Current: {setting.commission_rate}% commission
                      </p>
                    </div>

                    <div>
                      <Label>Status</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={setting.is_active}
                            onChange={() => updateSetting(setting.id, 'is_active', true)}
                            className="w-4 h-4 text-brand-green"
                          />
                          <span className="text-sm">Active</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={!setting.is_active}
                            onChange={() => updateSetting(setting.id, 'is_active', false)}
                            className="w-4 h-4 text-brand-green"
                          />
                          <span className="text-sm">Inactive</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`desc-${setting.id}`}>Description</Label>
                    <Textarea
                      id={`desc-${setting.id}`}
                      value={setting.description || ''}
                      onChange={(e) => updateSetting(setting.id, 'description', e.target.value)}
                      rows={3}
                      className="mt-2"
                      placeholder="Describe how this commission is applied..."
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => handleUpdate(setting)}
                      disabled={saving === setting.id}
                      className="bg-brand-green hover:bg-brand-green/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving === setting.id ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Revenue Calculation</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Commission is calculated as: <strong>Booking/Sale Amount × Commission Rate / 100</strong>
                </p>
                <p className="text-sm text-yellow-800 mt-2">
                  Example: $1,000 booking with 15% commission = $150 commission, $850 payout to host
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
