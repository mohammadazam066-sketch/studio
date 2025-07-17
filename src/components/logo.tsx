import Link from 'next/link';
import { Gem } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <Gem className="h-6 w-6 text-primary" />
      <span className="text-lg font-headline font-bold">
        Bidarkart
      </span>
    </Link>
  );
}
