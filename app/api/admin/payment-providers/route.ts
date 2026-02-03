import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    const { data: providers, error } = await supabase
      .from('payment_providers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const sanitizedProviders = providers?.map(provider => ({
      ...provider,
      api_key: '***HIDDEN***',
      api_secret: '***HIDDEN***'
    }));

    return NextResponse.json({ providers: sanitizedProviders });
  } catch (error: any) {
    console.error('Get payment providers error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const {
      provider_name,
      provider_type,
      api_endpoint,
      api_key,
      api_secret,
      ussd_prefix,
      ussd_suffix,
      active
    } = body;

    if (!provider_name || !provider_type || !api_endpoint || !api_key || !api_secret) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('payment_providers')
      .insert({
        provider_name,
        provider_type,
        api_endpoint,
        api_key,
        api_secret,
        ussd_prefix: ussd_prefix || '*712*',
        ussd_suffix: ussd_suffix || '#',
        active: active || false
      })
      .select()
      .single();

    if (error) throw error;

    const sanitizedData = {
      ...data,
      api_key: '***HIDDEN***',
      api_secret: '***HIDDEN***'
    };

    return NextResponse.json({ provider: sanitizedData }, { status: 201 });
  } catch (error: any) {
    console.error('Create payment provider error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    if (updates.api_key === '***HIDDEN***') {
      delete updates.api_key;
    }
    if (updates.api_secret === '***HIDDEN***') {
      delete updates.api_secret;
    }

    const { data, error } = await supabase
      .from('payment_providers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const sanitizedData = {
      ...data,
      api_key: '***HIDDEN***',
      api_secret: '***HIDDEN***'
    };

    return NextResponse.json({ provider: sanitizedData });
  } catch (error: any) {
    console.error('Update payment provider error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('payment_providers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete payment provider error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
