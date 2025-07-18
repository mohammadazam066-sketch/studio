
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ShopOwnerProfilePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Since profile pages are removed, redirect to dashboard.
    router.replace('/shop-owner/dashboard');
  }, [router]);

  return (
    <div className="space-y-6">
      <p>Redirecting...</p>
    </div>
  );
}
