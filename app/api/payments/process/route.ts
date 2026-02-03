import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { bookingId, paymentMethod, transactionReference } = await request.json();

    if (!bookingId || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, listings(host_id, commission_rate)')
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

    const commissionRate = booking.listings.commission_rate || 10;
    const totalAmount = parseFloat(booking.total_price);
    const commissionAmount = (totalAmount * commissionRate) / 100;
    const hostEarnings = totalAmount - commissionAmount;

    const { data: payment, error: paymentError } = await supabase
      .from('booking_payments')
      .insert({
        booking_id: bookingId,
        guest_id: booking.guest_id,
        host_id: booking.listings.host_id,
        amount: totalAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        host_earnings: hostEarnings,
        payment_method: paymentMethod,
        transaction_reference: transactionReference || `TXN-${Date.now()}`,
        status: 'completed',
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      return NextResponse.json(
        { success: false, error: 'Failed to create payment' },
        { status: 500 }
      );
    }

    const { error: bookingUpdateError } = await supabase
      .from('bookings')
      .update({ payment_status: 'paid' })
      .eq('id', bookingId);

    if (bookingUpdateError) {
      console.error('Booking update error:', bookingUpdateError);
    }

    const { data: wallet } = await supabase
      .from('host_wallets')
      .select('*')
      .eq('host_id', booking.listings.host_id)
      .single();

    if (wallet) {
      await supabase
        .from('host_wallets')
        .update({
          available_balance: parseFloat(wallet.available_balance) + hostEarnings,
          total_earnings: parseFloat(wallet.total_earnings) + hostEarnings,
          total_commission_paid: parseFloat(wallet.total_commission_paid) + commissionAmount,
        })
        .eq('host_id', booking.listings.host_id);
    }

    await supabase.from('transactions').insert([
      {
        user_id: booking.guest_id,
        type: 'booking_payment',
        amount: -totalAmount,
        status: 'completed',
        reference_id: bookingId,
        reference_type: 'booking',
        description: `Payment for booking #${bookingId}`,
      },
      {
        user_id: booking.listings.host_id,
        type: 'host_earning',
        amount: hostEarnings,
        status: 'completed',
        reference_id: bookingId,
        reference_type: 'booking',
        description: `Earnings from booking #${bookingId}`,
      },
      {
        user_id: booking.listings.host_id,
        type: 'commission',
        amount: -commissionAmount,
        status: 'completed',
        reference_id: bookingId,
        reference_type: 'booking',
        description: `Platform commission (${commissionRate}%)`,
      },
    ]);

    return NextResponse.json({
      success: true,
      payment,
      message: 'Payment processed successfully',
    });
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
