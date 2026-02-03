import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerConfigured } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    if (!isServerConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Please add your service role key in lib/supabase-config.ts' },
        { status: 500 }
      );
    }

    const supabaseAdmin = getSupabaseServerClient();

    const body = await request.json();
    const { listingId, reason } = body;

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updateData = {
      status: 'rejected',
      approval_status: 'rejected',
      is_active: false,
      is_available: false,
      rejected_at: new Date().toISOString(),
      rejection_reason: reason || null,
      approved_by: null,
      approved_at: null,
    };

    const { error } = await supabaseAdmin
      .from('listings')
      .update(updateData)
      .eq('id', listingId);

    if (error) {
      console.error('Reject listing error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reject listing error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
