import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerConfigured } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    if (!isServerConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Server configuration incomplete', listings: [] },
        { status: 500 }
      );
    }

    const supabaseAdmin = getSupabaseServerClient();

    const { data: listingsData, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (listingsError) {
      return NextResponse.json(
        { success: false, error: listingsError.message, listings: [] },
        { status: 500 }
      );
    }

    const enrichedListings = await Promise.all(
      (listingsData || []).map(async (listing) => {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('id', listing.host_id)
          .single();

        let hotels = null;
        let guesthouses = null;

        if (listing.listing_type === 'hotel') {
          const { data: hotelData } = await supabaseAdmin
            .from('hotels')
            .select('name, city, address, description, rating, amenities, check_in_time, check_out_time, images')
            .eq('listing_id', listing.id);
          hotels = hotelData;
        } else if (listing.listing_type === 'guesthouse' || listing.listing_type === 'fully_furnished' || listing.listing_type === 'rental') {
          const { data: guesthouseData } = await supabaseAdmin
            .from('guesthouses')
            .select('title, property_type, city, address, description, price, price_type, bedrooms, bathrooms, max_guests, amenities, images')
            .eq('listing_id', listing.id);
          guesthouses = guesthouseData;
        }

        return {
          ...listing,
          profiles: profile,
          hotels,
          guesthouses,
        };
      })
    );

    return NextResponse.json({
      success: true,
      listings: enrichedListings
    });
  } catch (error: any) {
    console.error('Get listings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred', listings: [] },
      { status: 500 }
    );
  }
}
