import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Missing bookingId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, payment_status, total_price, check_in, check_out, listings(host_id)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Booking must be confirmed by host first' },
        { status: 400 }
      );
    }

    if (booking.payment_status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Payment is already processed' },
        { status: 400 }
      );
    }

    const hostId = booking.listings?.host_id;
    if (!hostId) {
      return NextResponse.json(
        { success: false, error: 'Host not found for booking' },
        { status: 400 }
      );
    }

    const { data: wallet, error: walletError } = await supabase
      .from('host_wallets')
      .select('wallet_number, verified')
      .eq('host_id', hostId)
      .limit(1)
      .maybeSingle();

    if (walletError) {
      console.error('Host wallet load error:', walletError);
      return NextResponse.json(
        { success: false, error: walletError.message || 'Unable to load host wallet' },
        { status: 500 }
      );
    }

    if (!wallet?.wallet_number) {
      return NextResponse.json(
        { success: false, error: 'Host wallet number not set' },
        { status: 400 }
      );
    }

    if (!wallet.verified) {
      return NextResponse.json(
        { success: false, error: 'Host wallet not verified yet' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId: booking.id,
        totalAmount: booking.total_price,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        walletNumber: wallet.wallet_number,
      }
    });
  } catch (error: any) {
    console.error('EVC info error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
