'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type EvcInfo = {
  bookingId: string;
  totalAmount: string | number;
  checkIn: string;
  checkOut: string;
  walletNumber: string;
};

export default function EvcPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<EvcInfo | null>(null);

  const ussdCode = useMemo(() => {
    if (!info) return '';
    return `*712*${info.walletNumber}*${info.totalAmount}#`;
  }, [info]);

  useEffect(() => {
    const loadInfo = async () => {
      if (!bookingId) {
        setError('Missing bookingId');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/payments/evc-info?bookingId=${bookingId}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || 'Unable to load payment info');
          setLoading(false);
          return;
        }

        setInfo(result.data);
      } catch (err) {
        console.error('EVC info load error:', err);
        setError('Unable to load payment info');
      } finally {
        setLoading(false);
      }
    };

    loadInfo();
  }, [bookingId]);

  const handleConfirmPayment = async () => {
    if (!info) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: info.bookingId,
          paymentMethod: 'mobile_money',
          transactionReference: `EVC-${Date.now()}-${info.bookingId.slice(0, 8)}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Payment successful! Your booking is confirmed.');
        router.push('/dashboard');
      } else {
        toast.error(result.error || 'Payment failed. Please try again.');
      }
    } catch (err) {
      console.error('EVC payment error:', err);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Payment Unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Back to My Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-brand-green">
            <Smartphone className="h-5 w-5" />
            <span className="text-sm font-medium">Mobile Money (EVC Plus)</span>
          </div>
          <CardTitle>Complete Your Payment</CardTitle>
          <CardDescription>
            Dial the USSD code below to pay, then confirm.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-gray-100">
            <Label className="text-xs text-gray-500">USSD Code</Label>
            <div className="mt-1 font-mono text-lg text-gray-900">{ussdCode}</div>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div>Check-in: {format(new Date(info.checkIn), 'MMM dd, yyyy')}</div>
            <div>Check-out: {format(new Date(info.checkOut), 'MMM dd, yyyy')}</div>
            <div className="font-semibold text-gray-900">Total: ${info.totalAmount}</div>
          </div>

          <Button
            onClick={handleConfirmPayment}
            disabled={processing}
            className="w-full bg-brand-green hover:bg-brand-green/90"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                I Have Paid
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
