import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerConfigured } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    if (!isServerConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Please add your service role key in lib/supabase-config.ts' },
        { status: 500 }
      );
    }

    const supabaseAdmin = getSupabaseServerClient();

    const allProfilesRes = await supabaseAdmin.from('profiles').select('id, email, role, status');

    const hoyconnectProfiles = (allProfilesRes.data || []).filter((profile: any) => {
      const email = profile.email || '';
      return (
        !email.endsWith('@mogadishu.so') &&
        !email.startsWith('test_trigger_') &&
        profile.status !== 'deleted'
      );
    });

    const totalUsers = hoyconnectProfiles.length;
    const totalHosts = hoyconnectProfiles.filter((p: any) => p.role === 'host').length;
    const totalGuests = hoyconnectProfiles.filter((p: any) => p.role === 'guest').length;

    const allListingsRes = await supabaseAdmin.from('listings').select('id, listing_type, approval_status, host_id, profiles!host_id(email)');

    const hoyconnectListings = (allListingsRes.data || []).filter((listing: any) => {
      const hostEmail = listing.profiles?.email || '';
      return (
        !hostEmail.endsWith('@mogadishu.so') &&
        !hostEmail.startsWith('test_trigger_')
      );
    });

    const totalListings = hoyconnectListings.length;
    const totalHotels = hoyconnectListings.filter((l: any) => l.listing_type === 'hotel').length;
    const totalGuesthouses = hoyconnectListings.filter((l: any) => l.listing_type === 'guesthouse').length;
    const pendingListings = hoyconnectListings.filter((l: any) => l.approval_status === 'pending').length;
    const approvedListings = hoyconnectListings.filter((l: any) => l.approval_status === 'approved').length;
    const rejectedListings = hoyconnectListings.filter((l: any) => l.approval_status === 'rejected').length;

    let totalBookings = 0;
    let confirmedBookings = 0;
    let totalPropertySales = 0;
    let soldProperties = 0;
    let totalInquiries = 0;
    let newInquiries = 0;
    let totalRevenue = 0;
    let waitingListCount = 0;

    try {
      const bookingsRes = await supabaseAdmin.from('bookings').select('id, status', { count: 'exact' });
      totalBookings = bookingsRes.count || 0;
      confirmedBookings = (bookingsRes.data || []).filter((b: any) => b.status === 'confirmed').length;
    } catch (e) {
      console.log('Bookings table not available');
    }

    try {
      const propertySalesRes = await supabaseAdmin.from('property_sales').select('id, status', { count: 'exact' });
      totalPropertySales = propertySalesRes.count || 0;
      soldProperties = (propertySalesRes.data || []).filter((ps: any) => ps.status === 'sold').length;
    } catch (e) {
      console.log('Property sales table not available');
    }

    try {
      const inquiriesRes = await supabaseAdmin.from('sales_inquiries').select('id, status', { count: 'exact' });
      totalInquiries = inquiriesRes.count || 0;
      newInquiries = (inquiriesRes.data || []).filter((i: any) => i.status === 'new').length;
    } catch (e) {
      console.log('Sales inquiries table not available');
    }

    try {
      const paymentsRes = await supabaseAdmin.from('payments').select('amount');
      totalRevenue = (paymentsRes.data || []).reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
    } catch (e) {
      console.log('Payments table not available');
    }

    try {
      const waitingListRes = await supabaseAdmin.from('waiting_list').select('id', { count: 'exact', head: true });
      waitingListCount = waitingListRes.count || 0;
    } catch (e) {
      console.log('Waiting list table not available');
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalHosts,
        totalGuests,
        totalListings,
        totalHotels,
        totalGuesthouses,
        pendingListings,
        approvedListings,
        rejectedListings,
        totalBookings,
        confirmedBookings,
        totalPropertySales,
        soldProperties,
        totalInquiries,
        newInquiries,
        totalRevenue,
        waitingListCount,
      }
    });
  } catch (error: any) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
