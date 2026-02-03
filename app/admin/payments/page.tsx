'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, CreditCard, Calendar, Info } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Payment {
  id: string;
  total_price: number;
  payment_method: string;
  payment_status: string;
  booking_type: string;
  property_type: string;
  commission_amount?: number;
  guest_id: string;
  listing_id: string;
  check_in: string;
  check_out: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  listings?: {
    listing_type: string;
  };
}

interface CommissionSetting {
  id: string;
  listing_type: string;
  commission_percentage: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [commissions, setCommissions] = useState<CommissionSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
  });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          profiles:guest_id(full_name, email),
          listings:listing_id(listing_type)
        `)
        .in('property_type', ['hotel', 'fully_furnished'])
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('payment_status', filter);
      }

      const [paymentsRes, commissionsRes] = await Promise.all([
        query,
        supabase.from('commission_settings').select('*').order('listing_type'),
      ]);

      if (paymentsRes.error) {
        console.error('Error fetching payments:', paymentsRes.error);
        toast.error('Failed to load payments');
        setPayments([]);
      } else {
        setPayments(paymentsRes.data || []);

        const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + parseFloat(p.total_price || 0), 0) || 0;
        const completed = paymentsRes.data?.filter(p => p.payment_status === 'paid').length || 0;
        const pending = paymentsRes.data?.filter(p => p.payment_status === 'pending').length || 0;
        const failed = paymentsRes.data?.filter(p => p.payment_status === 'failed').length || 0;

        setStats({ totalRevenue, completedPayments: completed, pendingPayments: pending, failedPayments: failed });
      }

      if (commissionsRes.error) {
        console.error('Error fetching commission settings:', commissionsRes.error);
      } else if (commissionsRes.data) {
        setCommissions(commissionsRes.data);
      }
    } catch (error) {
      console.error('Unexpected error fetching payment data:', error);
      toast.error('Failed to load payment data');
      setPayments([]);
    }

    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return variants[status] || variants.pending;
  };

  const filteredPayments = payments.filter(p => {
    const searchLower = search.toLowerCase();
    const guestName = p.profiles?.full_name?.toLowerCase() || '';
    const guestEmail = p.profiles?.email?.toLowerCase() || '';
    return guestName.includes(searchLower) || guestEmail.includes(searchLower);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Payments & Commission</h1>
          <p className="text-muted-foreground mt-2">Track payments and manage commission settings</p>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900">Payment Analytics Scope</p>
                <p className="text-sm text-blue-800 mt-1">
                  This page shows payments from <strong>Hotel (15%)</strong> and <strong>Fully Furnished (12%)</strong> bookings only.
                  Rental properties are inquiry-based and do not appear in payment or commission analytics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-navy">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
                <div className="p-3 rounded-full bg-green-50">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-navy">{stats.completedPayments}</p>
                <div className="p-3 rounded-full bg-green-50">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-navy">{stats.pendingPayments}</p>
                <div className="p-3 rounded-full bg-yellow-50">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-navy">{stats.failedPayments}</p>
                <div className="p-3 rounded-full bg-red-50">
                  <CreditCard className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Commission Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {commissions.map((commission) => (
                <div key={commission.id} className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm text-muted-foreground capitalize">{commission.listing_type}</p>
                  <p className="text-2xl font-bold text-brand-green mt-1">
                    {commission.commission_percentage}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Input
                placeholder="Search payments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-green transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-brand-navy">
                        {payment.property_type === 'hotel' ? 'Hotel' : 'Fully Furnished'} Booking
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Guest: {payment.profiles?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Check-in: {format(new Date(payment.check_in), 'MMM dd, yyyy')} • {format(new Date(payment.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-bold text-lg text-brand-green">
                        ${Number(payment.total_price).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{payment.payment_method || 'Not specified'}</p>
                      {payment.commission_amount && (
                        <p className="text-xs text-muted-foreground">
                          Commission: ${Number(payment.commission_amount).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusBadge(payment.payment_status)}>
                      {payment.payment_status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredPayments.length === 0 && (
              <div className="py-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No payments found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
