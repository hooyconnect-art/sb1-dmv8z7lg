import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerConfigured } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    if (!isServerConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Server configuration incomplete' },
        { status: 500 }
      );
    }

    const supabaseAdmin = getSupabaseServerClient();

    const body = await request.json();
    const { listingId, approvedBy } = body;

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Missing listing ID' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status: 'approved',
      approval_status: 'approved',
      is_active: true,
      is_available: true,
      approved_at: new Date().toISOString(),
      rejected_at: null,
      rejection_reason: null,
    };

    if (approvedBy) {
      updateData.approved_by = approvedBy;
    }

    const { error } = await supabaseAdmin
      .from('listings')
      .update(updateData)
      .eq('id', listingId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approve listing error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
