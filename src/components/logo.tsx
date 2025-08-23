import Link from 'next/link';
import { Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2', className)}>
      <Workflow className="h-6 w-6 text-primary" />
      <span className="text-lg font-headline font-bold">
        kanstruction
      </span>
    </Link>
  );
}
