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
    const { userId, currentStatus } = body;

    if (!userId || !currentStatus) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId);

    if (error) {
      console.error('Toggle status error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, newStatus });
  } catch (error) {
    console.error('Toggle status error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
