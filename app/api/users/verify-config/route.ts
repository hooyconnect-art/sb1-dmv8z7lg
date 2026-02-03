import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerConfigured } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    if (!isServerConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Invalid service role key',
        details: 'Please add your service role key in lib/supabase-config.ts. Get it from: https://supabase.com/dashboard/project/szdnbrxfwckxceeywewh/settings/api',
        needsConfig: true
      }, { status: 500 });
    }

    const supabaseAdmin = getSupabaseServerClient();

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: error.message,
        needsConfig: true
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration is valid',
      supabaseUrl: supabaseUrl
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Configuration test failed',
      details: error.message
    }, { status: 500 });
  }
}
