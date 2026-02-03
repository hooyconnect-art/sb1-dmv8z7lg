'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  // Don't show footer on admin pages (AdminLayout has its own layout)
  const isAdminPage = pathname?.startsWith('/admin');

  if (isAdminPage) {
    return null;
  }

  return (
    <footer className="bg-brand-navy text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <Home className="h-6 w-6 text-brand-green" />
                <span className="text-xl font-bold text-white">HoyConnect</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your trusted marketplace for furnished homes, hotels, and serviced apartments across East Africa.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/properties" className="hover:text-brand-light-green transition-colors text-sm">
                  Browse Properties
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-brand-light-green transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-light-green transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/host/register" className="hover:text-brand-light-green transition-colors text-sm">
                  Become a Host
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="hover:text-brand-light-green transition-colors text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-brand-light-green transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-light-green transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cancellation" className="hover:text-brand-light-green transition-colors text-sm">
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-brand-green mt-0.5" />
                <span className="text-sm">Mogadishu, Somalia</span>
              </li>
              <li className="flex items-start space-x-2">
                <Phone className="h-5 w-5 text-brand-green mt-0.5" />
                <span className="text-sm">+252 61 234 5678</span>
              </li>
              <li className="flex items-start space-x-2">
                <Mail className="h-5 w-5 text-brand-green mt-0.5" />
                <span className="text-sm">info@hoyconnect.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm">
          <p className="text-gray-400">&copy; {new Date().getFullYear()} HoyConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
