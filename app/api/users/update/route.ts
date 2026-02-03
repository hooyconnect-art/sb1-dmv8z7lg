import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerConfigured } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    if (!isServerConfigured()) {
      console.error('Server not configured - service role key missing');
      return NextResponse.json(
        { success: false, error: 'Service role key not configured. Check server logs.' },
        { status: 500 }
      );
    }

    console.log('✓ Server configured, creating admin client...');
    const supabaseAdmin = getSupabaseServerClient();
    console.log('✓ Admin client created successfully');

    const body = await request.json();
    const { userId, fullName, phone, status, propertyTypes } = body;

    if (!userId || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updateData: any = {
      full_name: fullName,
      phone: phone || null,
      status: status || 'active',
    };

    if (propertyTypes && propertyTypes.length > 0) {
      updateData.property_types = propertyTypes;
    }

    console.log('Updating user:', userId, 'with data:', updateData);

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update user error:', error);
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('User updated successfully:', data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
