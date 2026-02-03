# HoyConnect - Hotel & Property Booking Platform

Your trusted marketplace for hotels, furnished homes, and serviced apartments across East Africa.

## 🏨 Full Hotel Booking Support

HoyConnect is a **complete hotel booking platform** that works just like Airbnb or Booking.com:

- ✅ **Hotel owners can register and add their hotels manually**
- ✅ **Guests can search, view, and book hotels with date selection**
- ✅ **Date-based booking with calendar picker**
- ✅ **Price per night calculation**
- ✅ **No double-booking system**
- ✅ **Admin approval workflow for quality control**

👉 **See [HOTEL_BOOKING_GUIDE.md](./HOTEL_BOOKING_GUIDE.md) for detailed hotel booking instructions**

## Features

### Guest Features
- Browse and search properties by city, type, and price
- View detailed property information with images and amenities
- Book properties with date selection and guest count
- View and manage bookings in dashboard
- Leave reviews and ratings

### Host Features
- List and manage properties
- Set pricing and availability
- View bookings and earnings
- Upload property images
- Track performance metrics

### Admin Features
- Approve or reject property listings
- Manage users and hosts
- View platform analytics
- Monitor all bookings
- Platform-wide oversight

## Tech Stack

- **Frontend**: Next.js 13, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your Supabase project dashboard.

### 3. Database Setup

The database schema is already created via migrations. Your Supabase instance includes:

- **profiles**: User profiles with roles (guest/host/admin)
- **properties**: Property listings
- **bookings**: Booking records
- **reviews**: User reviews and ratings
- **payments**: Payment tracking (future ready)

### 4. Create an Admin User

After registering your first user, you can manually update their role to 'admin' in Supabase:

1. Go to Supabase Dashboard → Table Editor → profiles
2. Find your user and change `role` from 'guest' to 'admin'
3. Refresh the app and you'll have admin access

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── properties/
│   │   └── [id]/
│   ├── book/[id]/
│   ├── dashboard/
│   ├── host/
│   │   ├── dashboard/
│   │   └── properties/new/
│   └── admin/dashboard/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── PropertyCard.tsx
│   └── SearchBar.tsx
├── contexts/
│   └── AuthContext.tsx
└── lib/
    ├── supabase.ts
    └── auth.ts
```

## User Roles

### Guest
- Default role for new users
- Can browse and book properties
- Access to guest dashboard

### Host
- Select during registration
- Can list and manage properties
- Properties require admin approval
- Access to host dashboard with earnings

### Admin
- Manually assigned
- Full platform access
- Approve/reject listings
- Manage users and bookings
- Platform analytics

## Key Features Implementation

### Authentication & Authorization
- Email/password authentication via Supabase
- Role-based access control (RLS)
- Protected routes for dashboards
- Profile management

### Property Management
- CRUD operations for properties
- Image support (URLs)
- Admin approval workflow
- Status tracking (pending/approved/rejected)

### Booking System
- Date range selection
- Price calculation
- Guest count validation
- Booking status management
- No double-booking prevention

### Search & Filter
- Search by city
- Filter by property type
- Price range filtering
- Real-time results

### Reviews & Ratings
- 5-star rating system
- Written reviews
- Average rating display
- Booking-based reviews

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

## Sample Data

To test the platform, you can:

1. Register as a Host
2. Add sample properties with Pexels images
3. Register as a Guest (different email)
4. Browse and book properties
5. Use admin account to approve listings

## Security Features

- Row Level Security (RLS) on all tables
- Role-based access control
- Protected API routes
- Secure authentication
- Input validation

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Support

For issues or questions, contact: info@hoyconnect.com
