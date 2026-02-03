import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <FileText className="h-16 w-16 text-brand-green mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-brand-navy mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: January 15, 2026</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using HoyConnect, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">2. Use License</h2>
              <p className="text-gray-700 mb-3">
                Permission is granted to temporarily access the services on HoyConnect for personal, non-commercial use only.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to decompile or reverse engineer any software</li>
                <li>Remove any copyright or proprietary notations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">3. Booking and Payments</h2>
              <p className="text-gray-700">
                All bookings are subject to availability and confirmation. Payment terms and conditions apply as specified during the booking process.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">4. User Accounts</h2>
              <p className="text-gray-700">
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">5. Host Responsibilities</h2>
              <p className="text-gray-700">
                Hosts must provide accurate property information, maintain property standards, and comply with all applicable laws and regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">6. Cancellation Policy</h2>
              <p className="text-gray-700">
                Cancellation policies vary by property. Please review the specific cancellation policy before making a booking.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">7. Limitation of Liability</h2>
              <p className="text-gray-700">
                HoyConnect shall not be held liable for any damages arising from the use or inability to use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">8. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">9. Contact Information</h2>
              <p className="text-gray-700">
                For questions about these Terms of Service, please contact us at legal@hoyconnect.com
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
