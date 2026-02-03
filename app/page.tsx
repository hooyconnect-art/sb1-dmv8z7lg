'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    // Redirect based on role
    if (profile?.role === 'super_admin' || profile?.role === 'admin') {
      router.replace('/admin');
    } else if (profile?.role === 'host') {
      router.replace('/host/dashboard');
    } else if (profile?.role === 'guest') {
      router.replace('/properties');
    } else {
      router.replace('/dashboard');
    }
  }, [user, profile, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-brand-navy to-brand-green">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  );
}
