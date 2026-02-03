'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPropertyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/host/listings/new');
  }, [router]);

  return null;
}
