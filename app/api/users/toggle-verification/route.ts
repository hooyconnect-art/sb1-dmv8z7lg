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
    const { userId, currentVerified } = body;

    if (!userId || currentVerified === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ verified: !currentVerified })
      .eq('id', userId);

    if (error) {
      console.error('Toggle verification error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, verified: !currentVerified });
  } catch (error) {
    console.error('Toggle verification error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
