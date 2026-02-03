import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Shield className="h-16 w-16 text-brand-green mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-brand-navy mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: January 15, 2026</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">1. Information We Collect</h2>
              <p className="text-gray-700 mb-3">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Account information (name, email, password)</li>
                <li>Profile information</li>
                <li>Booking and payment information</li>
                <li>Communications with us</li>
                <li>Property listings (for hosts)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process bookings and transactions</li>
                <li>Send you confirmations, updates, and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Protect against fraud and unauthorized transactions</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">3. Information Sharing</h2>
              <p className="text-gray-700 mb-3">
                We may share your information in the following situations:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>With hosts and guests to facilitate bookings</li>
                <li>With service providers who assist our operations</li>
                <li>To comply with legal requirements</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With your consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">4. Data Security</h2>
              <p className="text-gray-700">
                We implement appropriate security measures to protect your personal information. However, no method
                of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">5. Cookies and Tracking</h2>
              <p className="text-gray-700">
                We use cookies and similar tracking technologies to collect information about your browsing activities
                and improve your experience on our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">6. Your Rights</h2>
              <p className="text-gray-700 mb-3">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Object to processing of your information</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">7. Children's Privacy</h2>
              <p className="text-gray-700">
                Our services are not directed to children under 18. We do not knowingly collect personal information
                from children under 18.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">8. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this privacy policy from time to time. We will notify you of any changes by posting
                the new policy on this page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-brand-navy mb-3">9. Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about this privacy policy, please contact us at privacy@hoyconnect.com
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
