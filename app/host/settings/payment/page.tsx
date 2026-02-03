'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Wallet, Save, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HostWallet {
  id: string;
  host_id: string;
  wallet_number: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export default function HostPaymentSettingsPage() {
  const router = useRouter();
  const { profile, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [wallet, setWallet] = useState<HostWallet | null>(null);
  const [walletNumber, setWalletNumber] = useState('');

  useEffect(() => {
    if (loading) return;

    if (!profile || profile.role !== 'host') {
      router.replace('/login');
      return;
    }

    loadWallet();
  }, [profile, loading, router]);

  const loadWallet = async () => {
    try {
      const response = await fetch('/api/host/wallet');
      const data = await response.json();

      if (response.ok && data.wallet) {
        setWallet(data.wallet);
        setWalletNumber(data.wallet.wallet_number);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleSave = async () => {
    if (!walletNumber || walletNumber.trim() === '') {
      toast.error('Please enter your wallet number');
      return;
    }

    const walletRegex = /^[0-9]{9,12}$/;
    if (!walletRegex.test(walletNumber)) {
      toast.error('Invalid wallet number. Must be 9-12 digits.');
      return;
    }

    setSaving(true);
    try {
      const url = '/api/host/wallet';
      const method = wallet ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_number: walletNumber })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(wallet ? 'Wallet updated successfully' : 'Wallet created successfully');
        await loadWallet();
      } else {
        toast.error(data.error || 'Failed to save wallet');
      }
    } catch (error: any) {
      console.error('Error saving wallet:', error);
      toast.error('Failed to save wallet');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingWallet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/host/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">EVC/Wallet Settings</h1>
          <p className="text-gray-600 mt-2">Configure your EVC/Wallet number to receive payments</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-brand-green" />
                  Wallet Number
                </CardTitle>
                <CardDescription className="mt-2">
                  Your EVC/Wallet number where you will receive booking payments
                </CardDescription>
              </div>
              {wallet && (
                <Badge variant={wallet.verified ? 'default' : 'secondary'} className="ml-4">
                  {wallet.verified ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Verified
                    </>
                  )}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {wallet && !wallet.verified && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">Verification Pending</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your wallet number is under review. You will be able to receive payments once verified by the admin.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">How It Works</p>
                  <p className="text-sm text-blue-700 mt-1">
                    When a guest books your property, payments are automatically processed to your wallet number using the USSD format: <code className="bg-blue-100 px-1 py-0.5 rounded">*712*{'{'}WALLET{'}'} *{'{'}AMOUNT{'}'}#</code>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet_number">EVC/Wallet Number</Label>
              <Input
                id="wallet_number"
                type="text"
                placeholder="252612345678"
                value={walletNumber}
                onChange={(e) => setWalletNumber(e.target.value.replace(/\D/g, ''))}
                maxLength={12}
              />
              <p className="text-sm text-gray-500">
                Enter your 9-12 digit wallet number (numbers only)
              </p>
            </div>

            {wallet && wallet.verified && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Wallet Verified</p>
                    <p className="text-sm text-green-700 mt-1">
                      Your wallet is verified and ready to receive payments. All booking payments will be sent automatically to your wallet.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/host/dashboard')}
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
                    {wallet ? 'Update Wallet' : 'Save Wallet'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Payment Information</CardTitle>
            <CardDescription>Important information about receiving payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="bg-brand-green/10 p-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-brand-green" />
                </div>
                <div>
                  <p className="font-medium">Automatic Payment Processing</p>
                  <p className="text-gray-600">Payments are automatically sent to your wallet when bookings are confirmed</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-brand-green/10 p-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-brand-green" />
                </div>
                <div>
                  <p className="font-medium">Secure Transactions</p>
                  <p className="text-gray-600">All payments are processed through secure EVC/Wallet external API</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-brand-green/10 p-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-brand-green" />
                </div>
                <div>
                  <p className="font-medium">Real-time Status Updates</p>
                  <p className="text-gray-600">Payment status is updated immediately after processing</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
