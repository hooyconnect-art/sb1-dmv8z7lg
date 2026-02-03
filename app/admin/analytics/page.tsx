'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Building2, DollarSign, MapPin, Info } from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    bookingsByType: [] as any[],
    revenueByType: [] as any[],
    topCities: [] as any[],
    userGrowth: [] as any[],
    topHosts: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);

    const [listingsRes, bookingsRes, paymentsRes, profilesRes] = await Promise.all([
      supabase.from('listings').select('listing_type, status'),
      supabase.from('bookings').select('status, total_price'),
      supabase.from('payments').select('amount, payment_status'),
      supabase.from('profiles').select('role, created_at'),
    ]);

    const bookingsByType = [
      { type: 'Total Confirmed Bookings', count: bookingsRes.data?.filter((b: any) => b.status === 'confirmed').length || 0 },
      { type: 'Hotel Listings', count: listingsRes.data?.filter((l: any) => l.listing_type === 'hotel').length || 0 },
      { type: 'Fully Furnished Listings', count: listingsRes.data?.filter((l: any) => l.listing_type === 'fully_furnished').length || 0 },
      { type: 'Rental Listings (Inquiry Only)', count: listingsRes.data?.filter((l: any) => l.listing_type === 'rental').length || 0 },
    ];

    const revenueByType = [
      {
        type: 'Bookings Revenue',
        revenue: bookingsRes.data
          ?.filter((b: any) => b.status === 'confirmed')
          .reduce((sum: number, b: any) => sum + parseFloat(b.total_price || 0), 0) || 0
      },
      {
        type: 'Payments Completed',
        revenue: paymentsRes.data
          ?.filter((p: any) => p.payment_status === 'completed')
          .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0) || 0
      },
    ];

    const userGrowth = [
      { role: 'Guests', count: profilesRes.data?.filter((p: any) => p.role === 'guest').length || 0 },
      { role: 'Hosts', count: profilesRes.data?.filter((p: any) => p.role === 'host').length || 0 },
      { role: 'Admins', count: profilesRes.data?.filter((p: any) => p.role === 'admin' || p.role === 'super_admin').length || 0 },
    ];

    setAnalytics({
      bookingsByType,
      revenueByType,
      topCities: [],
      userGrowth,
      topHosts: [],
    });
    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-2">Platform performance insights</p>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900">Analytics Scope</p>
                <p className="text-sm text-blue-800 mt-1">
                  Revenue and payment analytics include <strong>Hotel (15%)</strong> and <strong>Fully Furnished (12%)</strong> bookings only.
                  Rental properties are inquiry-based with no automatic bookings or commission.
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-brand-green" />
                    Bookings by Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.bookingsByType.map((item) => (
                      <div key={item.type} className="flex items-center justify-between">
                        <span className="font-medium">{item.type}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-48 bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div
                              className="bg-brand-green h-full rounded-full"
                              style={{
                                width: `${Math.min((item.count / Math.max(...analytics.bookingsByType.map(b => b.count))) * 100, 100)}%`
                              }}
                            ></div>
                          </div>
                          <span className="font-bold text-brand-navy w-12 text-right">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-brand-green" />
                    Revenue by Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.revenueByType.map((item) => (
                      <div key={item.type} className="flex items-center justify-between">
                        <span className="font-medium">{item.type}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-48 bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div
                              className="bg-brand-green h-full rounded-full"
                              style={{
                                width: `${Math.min((item.revenue / Math.max(...analytics.revenueByType.map(r => r.revenue))) * 100, 100)}%`
                              }}
                            ></div>
                          </div>
                          <span className="font-bold text-brand-navy w-24 text-right">
                            ${item.revenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-brand-green" />
                  User Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {analytics.userGrowth.map((item) => (
                    <div key={item.role} className="text-center p-6 bg-gray-50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">{item.role}</p>
                      <p className="text-4xl font-bold text-brand-navy">{item.count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-brand-green" />
                    Top Cities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Data will appear as listings grow
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-brand-green" />
                    Top Performing Hosts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Data will appear as bookings grow
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
