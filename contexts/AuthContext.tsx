'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/lib/supabase';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isGuest: boolean;
  isHost: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  isGuest: false,
  isHost: false,
  isAdmin: false,
  isSuperAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  const fetchProfile = async (userId: string, retries = 3) => {
    try {
      for (let i = 0; i < retries; i++) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error(`Profile fetch error (attempt ${i + 1}/${retries}):`, error);
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          setProfile(null);
          return;
        }

        if (data) {
          setProfile(data);
          return;
        }

        // No data and no error means profile doesn't exist yet
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.error('No profile found after retries for user:', userId);
      setProfile(null);
    } catch (error) {
      console.error('Unexpected profile fetch error:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event, 'User:', session?.user?.email || 'none');

        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);

          // Fetch profile for SIGNED_IN events
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setLoading(true);
            (async () => {
              if (!mounted) return;

              try {
                await fetchProfile(session.user.id);
              } finally {
                if (mounted) {
                  setLoading(false);
                }
              }
            })();
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    setUser(null);
    setProfile(null);
    setLoading(false);
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const isGuest = profile?.role === 'guest';
  const isHost = profile?.role === 'host';
  const isAdmin = profile?.role === 'admin';
  const isSuperAdmin = profile?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signOut: handleSignOut,
      refreshProfile,
      isGuest,
      isHost,
      isAdmin,
      isSuperAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
