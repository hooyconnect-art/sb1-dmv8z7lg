'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Users, Building2, Calendar, ListChecks, LayoutDashboard, LogOut, Chrome as Home, DollarSign, MapPin, Tag, FileText, ChartBar as BarChart3, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/listings', label: 'Listings', icon: Building2 },
  { href: '/admin/property-sales', label: 'Property Sales', icon: Home },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/inquiries', label: 'Sales Inquiries', icon: FileText },
  { href: '/admin/payments', label: 'Payments', icon: DollarSign },
  { href: '/admin/settings/payment', label: 'Payment Settings', icon: Settings },
  { href: '/admin/commission', label: 'Commission Settings', icon: DollarSign },
  { href: '/admin/locations', label: 'Locations', icon: MapPin },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/content', label: 'Website Content', icon: FileText },
  { href: '/admin/waiting-list', label: 'Waiting List', icon: ListChecks },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: Shield },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut, profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 bg-brand-navy min-h-screen p-6 fixed left-0 top-0 bottom-0 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">HoyConnect</h1>
            <p className="text-sm text-gray-300 mt-1">Admin Panel</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-green text-white'
                      : 'text-gray-300 hover:bg-brand-navy/50 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="border-t border-gray-600 pt-4 mb-4">
              <p className="text-sm text-gray-300">Logged in as</p>
              <p className="text-white font-medium truncate">{profile?.email}</p>
              <p className="text-xs text-brand-green capitalize">{profile?.role}</p>
            </div>
            <Button
              variant="outline"
              className="w-full text-white border-gray-600 hover:bg-gray-700"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>

        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </ProtectedRoute>
  );
}
