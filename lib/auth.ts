import { supabase } from './supabase';

export async function signUp(email: string, password: string, fullName: string, role: 'guest' | 'host' = 'guest') {
  try {
    console.log('[SignUp] Starting signup process for:', email);

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log('[SignUp] Auth response:', {
      hasUser: !!authData?.user,
      hasSession: !!authData?.session,
      error: authError?.message
    });

    if (authError) {
      console.error('[SignUp] Auth error:', authError);
      return { data: null, error: authError };
    }

    if (!authData.user) {
      console.error('[SignUp] No user returned from signup');
      return { data: null, error: new Error('Signup failed: No user returned') };
    }

    console.log('[SignUp] User created successfully, ID:', authData.user.id);

    // Step 2: Explicitly create profile (NO TRIGGER)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        role: role,
      });

    if (profileError) {
      console.error('[SignUp] Profile creation error:', profileError);
      return {
        data: null,
        error: new Error('Failed to create user profile: ' + profileError.message)
      };
    }

    console.log('[SignUp] Profile created successfully');
    return { data: authData, error: null };
  } catch (error: any) {
    console.error('[SignUp] Unexpected error:', error);
    return { data: null, error: error };
  }
}

export async function signIn(email: string, password: string) {
  try {
    console.log('[SignIn] Starting signin process for:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('[SignIn] Auth response:', {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message
    });

    if (error) {
      console.error('[SignIn] Auth error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('[SignIn] Unexpected error:', error);
    return { data: null, error };
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return { data, error };
}

export async function updateProfile(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  return { data, error };
}
