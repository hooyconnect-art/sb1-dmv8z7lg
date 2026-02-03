import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseServerClient();
    const body = await request.json();
    const { userId, email, fullName, phone } = body || {};

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or email' },
        { status: 400 }
      );
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !authUser?.user) {
      return NextResponse.json(
        { success: false, error: 'Auth user not found' },
        { status: 404 }
      );
    }

    if (authUser.user.email?.toLowerCase() !== String(email).toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Email mismatch' },
        { status: 403 }
      );
    }

    const verified = !!authUser.user.email_confirmed_at;
    const role =
      (authUser.user.app_metadata as any)?.role ||
      (authUser.user.user_metadata as any)?.role ||
      'guest';

    const profilePayload = {
      id: userId,
      email: authUser.user.email,
      full_name:
        fullName ||
        (authUser.user.user_metadata as any)?.full_name ||
        (authUser.user.user_metadata as any)?.name ||
        '',
      phone:
        phone ||
        (authUser.user.user_metadata as any)?.phone ||
        null,
      role,
      status: 'active',
      verified,
      is_active: true,
    };

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { success: false, error: existingError.message },
        { status: 500 }
      );
    }

    if (!existing) {
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert(profilePayload);

      if (insertError) {
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }
    }

    // Ensure JWT role is synced
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { role },
    });

    return NextResponse.json({ success: true, created: !existing });
  } catch (error: any) {
    console.error('Ensure profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
