'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Save, Percent, TrendingUp, DollarSign, Users, Building2, AlertCircle } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface CommissionSettings {
  property_type: string;
  commission_rate: number;
  description: string;
}

export default function AdminPaymentSettingsPage() {
  const router = useRouter();
  const { profile, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const supabase = getSupabaseBrowserClient();

  const [commissions, setCommissions] = useState<CommissionSettings[]>([
    { property_type: 'hotel', commission_rate: 15, description: 'Hotels and Resorts' },
    { property_type: 'guesthouse', commission_rate: 12, description: 'Guesthouses' },
    { property_type: 'fully_furnished', commission_rate: 10, description: 'Fully Furnished Apartments' },
    { property_type: 'apartment_sale', commission_rate: 3, description: 'Apartment Sales' },
    { property_type: 'house_sale', commission_rate: 3, description: 'House Sales' },
    { property_type: 'commercial_sale', commission_rate: 4, description: 'Commercial Property Sales' },
  ]);

  const [platformSettings, setPlatformSettings] = useState({
    minimum_payout: 50,
    payout_frequency: 'weekly',
    auto_payout_enabled: false,
  });

  useEffect(() => {
    if (loading) return;

    if (!profile || profile.role !== 'super_admin') {
      router.replace('/login');
      return;
    }

    loadSettings();
    loadStats();
  }, [profile, loading, router]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_settings')
        .select('*')
        .order('property_type');

      if (error) throw error;

      if (data && data.length > 0) {
        setCommissions(data.map((item: any) => ({
          property_type: item.property_type,
          commission_rate: item.commission_rate,
          description: item.property_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        })));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: paymentsData } = await supabase
        .from('booking_payments')
        .select('amount, commission_amount, host_earnings, created_at');

      if (paymentsData) {
        const totalRevenue = paymentsData.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const totalCommission = paymentsData.reduce((sum, p) => sum + parseFloat(p.commission_amount), 0);
        const totalHostEarnings = paymentsData.reduce((sum, p) => sum + parseFloat(p.host_earnings), 0);

        setStats({
          totalRevenue,
          totalCommission,
          totalHostEarnings,
          transactionCount: paymentsData.length,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleUpdateCommission = (propertyType: string, newRate: number) => {
    setCommissions(commissions.map(c =>
      c.property_type === propertyType ? { ...c, commission_rate: newRate } : c
    ));
  };

  const handleSave = async () => {
    if (commissions.some(c => c.commission_rate < 0 || c.commission_rate > 100)) {
      toast.error('Commission rates must be between 0 and 100');
      return;
    }

    setSaving(true);
    try {
      for (const commission of commissions) {
        const { error } = await supabase
          .from('commission_settings')
          .upsert({
            property_type: commission.property_type,
            commission_rate: commission.commission_rate,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      toast.success('Commission settings saved successfully');
      await loadSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save commission settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment & Commission Settings</h1>
          <p className="text-gray-600 mt-2">Manage platform commission rates and payment settings</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-brand-green" />
                  <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Platform Commission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">${stats.totalCommission.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Host Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">${stats.totalHostEarnings.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <p className="text-2xl font-bold text-gray-900">{stats.transactionCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Rental Commission Rates
              </CardTitle>
              <CardDescription>Set commission rates for rental property types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {commissions.filter(c => !c.property_type.includes('sale')).map((commission) => (
                <div key={commission.property_type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">{commission.description}</Label>
                    <Badge variant="outline">{commission.property_type}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={commission.commission_rate}
                        onChange={(e) => handleUpdateCommission(commission.property_type, parseFloat(e.target.value) || 0)}
                        className="text-lg font-semibold"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 min-w-[60px]">
                      <Percent className="h-4 w-4" />
                      <span className="font-medium">{commission.commission_rate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Property Sale Commission Rates
              </CardTitle>
              <CardDescription>Set commission rates for property sales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {commissions.filter(c => c.property_type.includes('sale')).map((commission) => (
                <div key={commission.property_type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">{commission.description}</Label>
                    <Badge variant="outline">{commission.property_type}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={commission.commission_rate}
                        onChange={(e) => handleUpdateCommission(commission.property_type, parseFloat(e.target.value) || 0)}
                        className="text-lg font-semibold"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 min-w-[60px]">
                      <Percent className="h-4 w-4" />
                      <span className="font-medium">{commission.commission_rate}%</span>
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Property sale commissions are typically lower than rental commissions due to higher transaction values.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Platform Payout Settings</CardTitle>
            <CardDescription>Configure automatic payout settings for hosts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="minimum_payout">Minimum Payout Amount ($)</Label>
                <Input
                  id="minimum_payout"
                  type="number"
                  min="0"
                  step="10"
                  value={platformSettings.minimum_payout}
                  onChange={(e) => setPlatformSettings({
                    ...platformSettings,
                    minimum_payout: parseFloat(e.target.value) || 0
                  })}
                />
                <p className="text-sm text-gray-500">Minimum balance required for payout</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payout_frequency">Payout Frequency</Label>
                <select
                  id="payout_frequency"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={platformSettings.payout_frequency}
                  onChange={(e) => setPlatformSettings({
                    ...platformSettings,
                    payout_frequency: e.target.value
                  })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p className="text-sm text-gray-500">How often payouts are processed</p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Important Note</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Payout settings affect all hosts. Changes will apply to new payouts only.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/admin')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-green hover:bg-brand-green/90"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
