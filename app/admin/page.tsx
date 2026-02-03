'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Calendar, Clock, UserCheck, CheckCircle2, XCircle, Home, FileText, DollarSign, TrendingUp } from 'lucide-react';

function AdminOverviewContent() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHosts: 0,
    totalGuests: 0,
    totalListings: 0,
    totalRentals: 0,
    totalHotels: 0,
    totalGuesthouses: 0,
    pendingListings: 0,
    approvedListings: 0,
    rejectedListings: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    totalPropertySales: 0,
    soldProperties: 0,
    totalInquiries: 0,
    newInquiries: 0,
    totalRevenue: 0,
    waitingListCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const result = await response.json();

      if (result.success && result.stats) {
        setStats({
          ...result.stats,
          totalRentals: 0,
        });
      } else {
        console.error('Failed to fetch stats:', result.error);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      subtitle: `${stats.totalHosts} hosts, ${stats.totalGuests} guests`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Listings',
      value: stats.totalListings,
      subtitle: `${stats.totalRentals} rentals, ${stats.totalHotels} hotels, ${stats.totalGuesthouses} guesthouses`,
      icon: Building2,
      color: 'text-brand-green',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Property Sales',
      value: stats.totalPropertySales,
      subtitle: `${stats.soldProperties} sold`,
      icon: Home,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingListings,
      subtitle: 'Require attention',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      subtitle: `${stats.confirmedBookings} confirmed`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Sales Inquiries',
      value: stats.totalInquiries,
      subtitle: `${stats.newInquiries} new`,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      subtitle: 'All transactions',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Approved Listings',
      value: stats.approvedListings,
      subtitle: 'Active on platform',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Admin Overview</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage the HoyConnect platform
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-brand-navy">{card.value}</p>
                        {card.subtitle && (
                          <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                        )}
                      </div>
                      <div className={`p-3 rounded-full ${card.bgColor}`}>
                        <Icon className={`h-6 w-6 ${card.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <a
                  href="/admin/listings"
                  className="p-4 border border-gray-200 rounded-lg hover:border-brand-green hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-brand-navy mb-1">Review Pending Listings</h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.pendingListings} listing{stats.pendingListings !== 1 ? 's' : ''} awaiting approval
                  </p>
                </a>

                <a
                  href="/admin/users"
                  className="p-4 border border-gray-200 rounded-lg hover:border-brand-green hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-brand-navy mb-1">Manage Users</h3>
                  <p className="text-sm text-muted-foreground">
                    View and update user roles
                  </p>
                </a>

                <a
                  href="/admin/bookings"
                  className="p-4 border border-gray-200 rounded-lg hover:border-brand-green hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-brand-navy mb-1">View Bookings</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor all platform bookings
                  </p>
                </a>

                <a
                  href="/admin/waiting-list"
                  className="p-4 border border-gray-200 rounded-lg hover:border-brand-green hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-brand-navy mb-1">Waiting List</h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.waitingListCount} user{stats.waitingListCount !== 1 ? 's' : ''} on waiting list
                  </p>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Test User Flows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <a
                  href="/register"
                  className="p-4 border border-gray-200 rounded-lg hover:border-brand-green hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-brand-navy mb-1">Test Guest Registration</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a new guest account
                  </p>
                </a>

                <a
                  href="/host/register"
                  className="p-4 border border-gray-200 rounded-lg hover:border-brand-green hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-brand-navy mb-1">Test Host Registration</h3>
                  <p className="text-sm text-muted-foreground">
                    Register as a host
                  </p>
                </a>

                <a
                  href="/host/listings/new"
                  className="p-4 border border-gray-200 rounded-lg hover:border-brand-green hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-brand-navy mb-1">Test Create Listing</h3>
                  <p className="text-sm text-muted-foreground">
                    Test the listing creation flow
                  </p>
                </a>

                <a
                  href="/properties"
                  className="p-4 border border-gray-200 rounded-lg hover:border-brand-green hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-brand-navy mb-1">Test Browse Properties</h3>
                  <p className="text-sm text-muted-foreground">
                    View guest property browsing
                  </p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminOverview() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <AdminOverviewContent />
    </ProtectedRoute>
  );
}
