'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, Home, LogOut, LayoutDashboard, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut, isAdmin, isSuperAdmin, isHost } = useAuth();
  const isAdminPage = pathname?.startsWith('/admin');
  const isLoginPage = pathname === '/login';
  const isSignupPage = pathname === '/signup';

  if (isAdminPage || isLoginPage || isSignupPage) {
    return null;
  }

  // Don't show navbar if not logged in
  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
  };

  const getDashboardLink = () => {
    if (isSuperAdmin || isAdmin) return '/admin';
    if (isHost) return '/host/dashboard';
    return '/dashboard';
  };

  const getRoleBadge = () => {
    if (isSuperAdmin) return { label: 'Super Admin', color: 'bg-red-500' };
    if (isAdmin) return { label: 'Admin', color: 'bg-blue-500' };
    if (isHost) return { label: 'Host', color: 'bg-green-500' };
    return { label: 'Guest', color: 'bg-gray-500' };
  };

  const roleBadge = getRoleBadge();

  return (
    <nav className="bg-brand-navy border-b border-brand-navy shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href={getDashboardLink()} className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-brand-green" />
              <span className="text-2xl font-bold text-white">HoyConnect</span>
            </Link>
            {profile && (
              <Badge className={`${roleBadge.color} text-white font-semibold hidden sm:inline-flex`}>
                {roleBadge.label}
              </Badge>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {(isSuperAdmin || isAdmin) && (
              <Link href="/admin">
                <Button variant="ghost" className="text-white hover:text-brand-light-green hover:bg-brand-navy/80">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            )}
            {isHost && (
              <Link href="/host/dashboard">
                <Button variant="ghost" className="text-white hover:text-brand-light-green hover:bg-brand-navy/80">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Host Dashboard
                </Button>
              </Link>
            )}
            {!isSuperAdmin && !isAdmin && !isHost && (
              <Link href="/dashboard">
                <Button variant="ghost" className="text-white hover:text-brand-light-green hover:bg-brand-navy/80">
                  <Calendar className="h-4 w-4 mr-2" />
                  My Bookings
                </Button>
              </Link>
            )}
            <Link href="/properties">
              <Button variant="ghost" className="text-white hover:text-brand-light-green hover:bg-brand-navy/80">
                Browse Properties
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-white hover:text-brand-light-green hover:bg-brand-navy/80"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white hover:bg-brand-navy/80">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-navy border-t border-white/10 shadow-md py-2">
          <div className="px-4 space-y-2">
            {(isSuperAdmin || isAdmin) && (
              <Link href="/admin" className="block py-2">
                <Button variant="ghost" className="w-full justify-start text-white hover:text-brand-light-green hover:bg-brand-navy/80">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            )}
            {isHost && (
              <Link href="/host/dashboard" className="block py-2">
                <Button variant="ghost" className="w-full justify-start text-white hover:text-brand-light-green hover:bg-brand-navy/80">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Host Dashboard
                </Button>
              </Link>
            )}
            {!isSuperAdmin && !isAdmin && !isHost && (
              <Link href="/dashboard" className="block py-2">
                <Button variant="ghost" className="w-full justify-start text-white hover:text-brand-light-green hover:bg-brand-navy/80">
                  <Calendar className="h-4 w-4 mr-2" />
                  My Bookings
                </Button>
              </Link>
            )}
            <Link href="/properties" className="block py-2">
              <Button variant="ghost" className="w-full justify-start text-white hover:text-brand-light-green hover:bg-brand-navy/80">
                Browse Properties
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-white hover:text-brand-light-green hover:bg-brand-navy/80"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
