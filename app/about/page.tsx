import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, Target, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Building2 className="h-16 w-16 text-brand-green mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-brand-navy mb-4">About HoyConnect</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connecting travelers with unique accommodations and authentic experiences
          </p>
        </div>

        <div className="mb-16">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-3xl font-bold text-brand-navy mb-4">Our Story</h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                HoyConnect was founded with a simple mission: to make travel more accessible, affordable, and authentic.
                We believe that everyone deserves to experience the world, and the best way to do that is by connecting
                with local hosts and communities.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Our platform brings together property owners and travelers, creating meaningful connections and
                unforgettable experiences. Whether you're looking for a cozy guesthouse or a full-service hotel,
                HoyConnect makes it easy to find and book your perfect stay.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-12 w-12 text-brand-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-brand-navy mb-2">Community First</h3>
              <p className="text-gray-600">
                Building strong relationships between hosts and guests is at the heart of everything we do.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-12 w-12 text-brand-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-brand-navy mb-2">Trust & Safety</h3>
              <p className="text-gray-600">
                We maintain high standards for all properties and provide secure booking and payment systems.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="h-12 w-12 text-brand-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-brand-navy mb-2">Quality Experience</h3>
              <p className="text-gray-600">
                Every property is carefully reviewed to ensure it meets our standards for comfort and hospitality.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-brand-green text-white">
          <CardContent className="pt-6 text-center">
            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="text-lg mb-6 max-w-2xl mx-auto">
              Whether you're looking to travel or share your space with others,
              HoyConnect is here to help you every step of the way.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/register"
                className="bg-white text-brand-green px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition"
              >
                Sign Up as Guest
              </a>
              <a
                href="/dashboard"
                className="bg-brand-navy text-white px-8 py-3 rounded-md font-semibold hover:bg-brand-navy/90 transition"
              >
                Become a Host
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
