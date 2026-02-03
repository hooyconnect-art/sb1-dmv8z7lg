import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseServerClient();
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase environment variables missing' },
        { status: 500 }
      );
    }

    const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
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
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*, listings!inner(host_id)')
      .eq('id', booking_id)
      .single();

    if (bookingError) throw bookingError;

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.listings.host_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only process payments for your own bookings' },
        { status: 403 }
      );
    }

    if (booking.status === 'confirmed') {
      return NextResponse.json(
        { error: 'Booking already confirmed' },
        { status: 400 }
      );
    }

    const { error: confirmError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', booking.id);

    if (confirmError) throw confirmError;

    return NextResponse.json({
      success: true,
      message: 'Booking confirmed successfully'
    });
  } catch (error: any) {
    console.error('Process payment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
