'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = getSupabaseBrowserClient();
  const redirectTo = searchParams.get('redirect');
  const isSafeRedirect = (value: string) =>
    value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/login');
  const isAllowedRedirect = (value: string) => {
    const allowedExact = new Set([
      '/admin',
      '/admin/settings',
      '/host/dashboard',
      '/host/settings',
      '/properties',
      '/dashboard',
      '/browse',
      '/profile',
      '/settings',
      '/account',
    ]);
    const allowedPrefixes = ['/book/', '/listings/', '/properties/'];
    if (allowedExact.has(value)) return true;
    return allowedPrefixes.some((prefix) => value.startsWith(prefix));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      if (!data.user || !data.session) {
        setError('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      // Wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 800));

      // Fetch user profile to get role and status
      const { data: fetchedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role, status, verified')
        .eq('id', data.user.id)
        .maybeSingle();
      let profile = fetchedProfile;

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setError('Unable to load your profile. Please try again.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (!profile) {
        try {
          await fetch('/api/users/ensure-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.user.id,
              email: data.user.email,
              fullName: (data.user.user_metadata as any)?.full_name || '',
              phone: (data.user.user_metadata as any)?.phone || null,
            }),
          });

          const { data: retryProfile } = await supabase
            .from('profiles')
            .select('role, status, verified')
            .eq('id', data.user.id)
            .maybeSingle();

          if (retryProfile) {
            profile = retryProfile;
          }
        } catch (ensureError) {
          console.warn('Profile ensure failed:', ensureError);
        }
      }

      if (!profile) {
        console.error('Profile not found for user:', data.user.id);
        setError('Account profile not found. Please contact support.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (profile.status !== 'active') {
        setError('Your account has been deactivated. Please contact support.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Determine redirect path based on role
      let redirectPath = '/properties';

      if (redirectTo && isSafeRedirect(redirectTo) && isAllowedRedirect(redirectTo)) {
        redirectPath = redirectTo;
      } else if (redirectTo) {
        console.warn('Blocked unsafe or unapproved redirect:', redirectTo);
      } else {
        switch (profile.role) {
          case 'super_admin':
          case 'admin':
            redirectPath = '/admin';
            break;
          case 'host':
            redirectPath = '/host/dashboard';
            break;
          case 'guest':
          default:
            redirectPath = '/properties';
            break;
        }
      }

      console.log('Login successful. Redirecting to:', redirectPath);
      window.location.href = redirectPath;
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-muted-bg py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-brand-green" />
          </div>
          <CardTitle className="text-2xl font-bold text-brand-navy">Welcome Back</CardTitle>
          <CardDescription>Sign in to your HoyConnect account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus:ring-brand-green focus:border-brand-green"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="focus:ring-brand-green focus:border-brand-green"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-semibold"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="text-brand-green hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
