'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hotel, Home, Building, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ListingTypeSelection() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'hotel' | 'furnished' | 'rental' | null>(null);

  const handleContinue = () => {
    if (selectedType === 'hotel') {
      router.push('/host/listings/new/hotel');
    } else if (selectedType === 'furnished') {
      router.push('/host/listings/new/guesthouse?type=furnished');
    } else if (selectedType === 'rental') {
      router.push('/host/listings/new/guesthouse?type=rental');
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/host/dashboard" className="inline-flex items-center text-primary hover:text-primary/90 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">What are you listing?</h1>
          <p className="text-gray-600">Choose the type of property you want to list</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedType === 'hotel'
                ? 'border-primary border-2 shadow-lg'
                : 'border-gray-200'
            }`}
            onClick={() => setSelectedType('hotel')}
          >
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className={`p-6 rounded-full ${
                  selectedType === 'hotel' ? 'bg-primary/10' : 'bg-gray-100'
                }`}>
                  <Hotel className={`h-12 w-12 ${
                    selectedType === 'hotel' ? 'text-primary' : 'text-gray-600'
                  }`} />
                </div>
              </div>
              <CardTitle className="text-center text-2xl">Hotel</CardTitle>
              <CardDescription className="text-center">
                List a hotel with multiple rooms, check-in/out times, and various amenities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Multiple room types
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Set different prices per room
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Manage room quantities
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Hotel-wide amenities
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedType === 'furnished'
                ? 'border-primary border-2 shadow-lg'
                : 'border-gray-200'
            }`}
            onClick={() => setSelectedType('furnished')}
          >
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className={`p-6 rounded-full ${
                  selectedType === 'furnished' ? 'bg-primary/10' : 'bg-gray-100'
                }`}>
                  <Home className={`h-12 w-12 ${
                    selectedType === 'furnished' ? 'text-primary' : 'text-gray-600'
                  }`} />
                </div>
              </div>
              <CardTitle className="text-center text-2xl">Fully Furnished</CardTitle>
              <CardDescription className="text-center">
                List a fully furnished property for short-term or monthly stays
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Furnished apartments & homes
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Per night or per month pricing
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Ready to move in
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Full amenities included
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedType === 'rental'
                ? 'border-primary border-2 shadow-lg'
                : 'border-gray-200'
            }`}
            onClick={() => setSelectedType('rental')}
          >
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className={`p-6 rounded-full ${
                  selectedType === 'rental' ? 'bg-primary/10' : 'bg-gray-100'
                }`}>
                  <Building className={`h-12 w-12 ${
                    selectedType === 'rental' ? 'text-primary' : 'text-gray-600'
                  }`} />
                </div>
              </div>
              <CardTitle className="text-center text-2xl">Rental</CardTitle>
              <CardDescription className="text-center">
                List properties for long-term rental - residential or commercial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Long-term rentals
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Apartments, villas, offices
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Residential & commercial
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Monthly pricing
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            className="px-12"
            disabled={!selectedType}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NewListingPage() {
  return (
    <ProtectedRoute requiredRole="host">
      <ListingTypeSelection />
    </ProtectedRoute>
  );
}
