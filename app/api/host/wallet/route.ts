import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseServerClient } from '@/lib/supabase-server';

function getSupabaseAuthClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables missing');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name, options) {
        cookieStore.set({ name, value: '', ...options, maxAge: 0 });
      }
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseServerClient();
    const supabaseAuth = getSupabaseAuthClient();

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'host' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Host only' }, { status: 403 });
    }

    const { data: wallet, error } = await supabaseAdmin
      .from('host_wallets')
      .select('*')
      .eq('host_id', user.id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ wallet });
  } catch (error: any) {
    console.error('Get host wallet error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseServerClient();
    const supabaseAuth = getSupabaseAuthClient();

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'host') {
      return NextResponse.json({ error: 'Forbidden: Host only' }, { status: 403 });
    }

    const body = await request.json();
    const { wallet_number } = body;

    if (!wallet_number) {
      return NextResponse.json(
        { error: 'Wallet number is required' },
        { status: 400 }
      );
    }

    const walletRegex = /^[0-9]{9,12}$/;
    if (!walletRegex.test(wallet_number)) {
      return NextResponse.json(
        { error: 'Invalid wallet number format. Must be 9-12 digits.' },
        { status: 400 }
      );
    }

    const { data: existingWallet } = await supabaseAdmin
      .from('host_wallets')
      .select('id')
      .eq('host_id', user.id)
      .maybeSingle();

    if (existingWallet) {
      return NextResponse.json(
        { error: 'Wallet already exists. Use PUT to update.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('host_wallets')
      .insert({
        host_id: user.id,
        wallet_number,
        verified: false
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ wallet: data }, { status: 201 });
  } catch (error: any) {
    console.error('Create host wallet error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseServerClient();
    const supabaseAuth = getSupabaseAuthClient();

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'host' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { wallet_number, verified } = body;

    if (profile?.role === 'host' && verified !== undefined) {
      return NextResponse.json(
        { error: 'Hosts cannot update verification status' },
        { status: 403 }
      );
    }

    if (wallet_number) {
      const walletRegex = /^[0-9]{9,12}$/;
      if (!walletRegex.test(wallet_number)) {
        return NextResponse.json(
          { error: 'Invalid wallet number format. Must be 9-12 digits.' },
          { status: 400 }
        );
      }
    }

    const updates: any = {};
    if (wallet_number !== undefined) updates.wallet_number = wallet_number;
    if (verified !== undefined && profile?.role === 'super_admin') {
      updates.verified = verified;
    }

    const { data, error } = await supabaseAdmin
      .from('host_wallets')
      .update(updates)
      .eq('host_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ wallet: data });
  } catch (error: any) {
    console.error('Update host wallet error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
