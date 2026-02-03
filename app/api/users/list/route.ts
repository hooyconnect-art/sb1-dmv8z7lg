import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerConfigured } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    if (!isServerConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Please add your service role key in lib/supabase-config.ts', users: [] },
        { status: 500 }
      );
    }

    const supabaseAdmin = getSupabaseServerClient();

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .neq('status', 'deleted');

    if (profilesError) {
      console.error('Fetch users error:', profilesError);
      return NextResponse.json(
        { success: false, error: profilesError.message, users: [] },
        { status: 500 }
      );
    }

    // Backfill missing profiles from auth.users (in case trigger failed)
    const { data: authList, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authListError) {
      console.error('Auth list users error:', authListError);
    } else if (authList?.users?.length) {
      const existingIds = new Set((profiles || []).map((p: any) => p.id));
      const inserts = authList.users
        .filter((u: any) => !existingIds.has(u.id))
        .map((u: any) => ({
          id: u.id,
          email: u.email,
          full_name: u.user_metadata?.full_name || u.user_metadata?.name || '',
          phone: u.user_metadata?.phone || null,
          role: u.app_metadata?.role || u.user_metadata?.role || 'guest',
          status: 'active',
          verified: !!u.email_confirmed_at,
          is_active: true,
        }));

      if (inserts.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert(inserts);

        if (insertError) {
          console.error('Backfill profiles error:', insertError);
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch users error (after backfill):', error);
      return NextResponse.json(
        { success: false, error: error.message, users: [] },
        { status: 500 }
      );
    }

    // Filter to show only HoyConnect users
    // Exclude: *@mogadishu.so (Waste Management) and test users
    const hoyconnectUsers = (data || []).filter(user => {
      const email = user.email || '';
      return (
        !email.endsWith('@mogadishu.so') &&
        !email.startsWith('test_trigger_')
      );
    });

    return NextResponse.json({
      success: true,
      users: hoyconnectUsers
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred', users: [] },
      { status: 500 }
    );
  }
}
