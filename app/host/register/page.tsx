import { BecomeHostForm } from '@/components/BecomeHostForm';
import { Building2 } from 'lucide-react';

export default function HostRegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Building2 className="h-16 w-16 text-brand-green mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-brand-navy mb-4">Become a Host on HoyConnect</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Share your property with travelers from around the world and start earning income today.
          </p>
        </div>

        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-brand-green mb-2">1</div>
              <h3 className="font-semibold text-brand-navy mb-2">Submit Request</h3>
              <p className="text-sm text-gray-600">Fill out the form with your property details</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-brand-green mb-2">2</div>
              <h3 className="font-semibold text-brand-navy mb-2">Get Approved</h3>
              <p className="text-sm text-gray-600">Our team reviews and approves your request</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-brand-green mb-2">3</div>
              <h3 className="font-semibold text-brand-navy mb-2">Start Hosting</h3>
              <p className="text-sm text-gray-600">List your property and welcome guests</p>
            </div>
          </div>
        </div>

        <BecomeHostForm />

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-brand-navy mb-3">Why Host with HoyConnect?</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-brand-green font-bold">✓</span>
              <span>Reach thousands of travelers looking for unique stays</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-green font-bold">✓</span>
              <span>Secure payment processing and host protection</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-green font-bold">✓</span>
              <span>24/7 customer support for hosts and guests</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-green font-bold">✓</span>
              <span>Easy-to-use dashboard to manage bookings and earnings</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
