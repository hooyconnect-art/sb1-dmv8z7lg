import { Card, CardContent } from '@/components/ui/card';
import { XCircle, Clock, DollarSign, AlertCircle } from 'lucide-react';

export default function CancellationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <XCircle className="h-16 w-16 text-brand-green mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-brand-navy mb-4">Cancellation Policy</h1>
          <p className="text-lg text-gray-600">
            Understanding our cancellation terms and refund policies
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-4">
                <Clock className="h-8 w-8 text-brand-green flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-semibold text-brand-navy mb-3">Flexible Cancellation</h2>
                  <p className="text-gray-700 mb-3">
                    Cancel up to 24 hours before check-in for a full refund (minus service fees).
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Full refund if cancelled 24+ hours before check-in</li>
                    <li>50% refund if cancelled within 24 hours of check-in</li>
                    <li>No refund if cancelled after check-in time</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-4">
                <DollarSign className="h-8 w-8 text-brand-green flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-semibold text-brand-navy mb-3">Moderate Cancellation</h2>
                  <p className="text-gray-700 mb-3">
                    Cancel up to 5 days before check-in for a full refund (minus service fees).
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Full refund if cancelled 5+ days before check-in</li>
                    <li>50% refund if cancelled 2-5 days before check-in</li>
                    <li>No refund if cancelled within 2 days of check-in</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-4">
                <AlertCircle className="h-8 w-8 text-brand-green flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-semibold text-brand-navy mb-3">Strict Cancellation</h2>
                  <p className="text-gray-700 mb-3">
                    Cancel up to 7 days before check-in for a 50% refund (minus service fees).
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>50% refund if cancelled 7+ days before check-in</li>
                    <li>No refund if cancelled within 7 days of check-in</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold text-brand-navy mb-3">Important Information</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-fit">•</span>
                  <span>
                    The cancellation policy is set by each individual host and will be clearly displayed
                    on the property listing page before booking.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-fit">•</span>
                  <span>
                    Service fees are non-refundable unless the host cancels the reservation.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-fit">•</span>
                  <span>
                    Refunds are processed within 5-10 business days to the original payment method.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-fit">•</span>
                  <span>
                    Special circumstances (emergencies, natural disasters) may be considered on a case-by-case basis.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-brand-green text-white">
            <CardContent className="pt-6 text-center">
              <h3 className="text-2xl font-semibold mb-3">Need to Cancel?</h3>
              <p className="mb-4">
                You can cancel your booking directly from your dashboard or contact our support team for assistance.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <a
                  href="/dashboard"
                  className="bg-white text-brand-green px-6 py-2 rounded-md font-semibold hover:bg-gray-100 transition"
                >
                  Go to Dashboard
                </a>
                <a
                  href="/contact"
                  className="bg-brand-navy text-white px-6 py-2 rounded-md font-semibold hover:bg-brand-navy/90 transition"
                >
                  Contact Support
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
