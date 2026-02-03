import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { serviceRoleKey } = await request.json();

    if (!serviceRoleKey || serviceRoleKey === 'your_service_role_key_here') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid service role key provided'
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      return NextResponse.json(
        {
          success: false,
          message: 'Supabase URL not configured'
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = getSupabaseServerClient();

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .neq('status', 'deleted');

    if (profilesError) {
      return NextResponse.json(
        {
          success: false,
          message: `Database error: ${profilesError.message}. Please verify your service role key is correct.`
        },
        { status: 500 }
      );
    }

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const profile of profiles || []) {
      try {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          profile.id,
          {
            app_metadata: {
              role: profile.role
            }
          }
        );

        if (authError) {
          failCount++;
          errors.push(`${profile.email}: ${authError.message}`);
        } else {
          successCount++;
        }
      } catch (err: any) {
        failCount++;
        errors.push(`${profile.email}: ${err.message}`);
      }
    }

    if (successCount === 0 && failCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to sync any users. ${errors[0] || 'Unknown error'}`
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${successCount} user${successCount !== 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}`,
      synced: successCount,
      failed: failCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Sync users error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
