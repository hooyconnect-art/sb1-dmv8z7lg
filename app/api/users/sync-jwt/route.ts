import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerConfigured } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!isServerConfigured()) {
      console.log('Service role key not configured, skipping JWT sync');
      return NextResponse.json(
        { success: true, message: 'JWT sync skipped (service role key not configured)' },
        { status: 200 }
      );
    }

    const supabaseAdmin = getSupabaseServerClient();

    if (userId) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, role, email')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        );
      }

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.id,
        {
          app_metadata: {
            role: profile.role
          }
        }
      );

      if (authError) {
        console.error(`Failed to update JWT for ${profile.email}:`, authError);
        return NextResponse.json(
          { success: false, error: authError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `JWT synced for ${profile.email}`
      });
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, email')
      .neq('status', 'deleted');

    if (profilesError) {
      console.error('Fetch profiles error:', profilesError);
      return NextResponse.json(
        { success: false, error: profilesError.message },
        { status: 500 }
      );
    }

    const results = [];
    for (const profile of profiles || []) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.id,
        {
          app_metadata: {
            role: profile.role
          }
        }
      );

      if (authError) {
        console.error(`Failed to update JWT for ${profile.email}:`, authError);
        results.push({ email: profile.email, success: false, error: authError.message });
      } else {
        results.push({ email: profile.email, success: true });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Synced ${successCount} users, ${failCount} failed`,
      results
    });
  } catch (error: any) {
    console.error('Sync JWT error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
