import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, MessageSquare } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <HelpCircle className="h-16 w-16 text-brand-green mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-brand-navy mb-4">Help Center</h1>
          <p className="text-lg text-gray-600">Find answers to common questions</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do I book a property?</AccordionTrigger>
                <AccordionContent>
                  Browse available properties, select your dates, and click "Book Now" to complete your reservation.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>How do I become a host?</AccordionTrigger>
                <AccordionContent>
                  Visit your dashboard and submit a host request. Our team will review your application within 24-48 hours.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>What payment methods are accepted?</AccordionTrigger>
                <AccordionContent>
                  We accept all major credit cards, debit cards, and secure online payment methods.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Can I cancel my booking?</AccordionTrigger>
                <AccordionContent>
                  Yes, cancellation policies vary by property. Check the specific property's cancellation policy before booking.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>How do I contact support?</AccordionTrigger>
                <AccordionContent>
                  You can reach us through the contact page or email us at support@hoyconnect.com
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="bg-brand-green text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <MessageSquare className="h-10 w-10" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
                <p className="mb-4">Our support team is here to assist you</p>
                <Link
                  href="/contact"
                  className="inline-block bg-white text-brand-green px-6 py-2 rounded-md font-semibold hover:bg-gray-100 transition"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
