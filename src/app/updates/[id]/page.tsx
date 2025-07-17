
'use client';

import { getUpdateById } from '@/lib/store';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Store, Bot, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState, useCallback } from 'react';
import type { Update, UserRole } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function formatDate(date: Date | string | Timestamp) {
    if (!date) return 'Unknown date';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP');
}

function RoleIcon({ role }: { role: UserRole }) {
    if (role === 'homeowner') return <User className="h-4 w-4 text-muted-foreground" />;
    if (role === 'shop-owner') return <Store className="h-4 w-4 text-muted-foreground" />;
    return <Bot className="h-4 w-4 text-muted-foreground" />;
}

function PageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <Skeleton className="h-10 w-32" />
      <Card>
        <Skeleton className="h-64 w-full rounded-t-lg" />
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function UpdateDetailPage() {
  const params = useParams();
  const { id } = params;
  
  const [update, setUpdate] = useState<Update | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (typeof id !== 'string') return;
    setLoading(true);

    const updateData = await getUpdateById(id);
    setUpdate(updateData);
    setLoading(false);
  }, [id]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (!update) {
    return (
        <div className="text-center py-20">
             <h2 className="text-xl font-medium">Post not found</h2>
             <p className="text-muted-foreground mt-2">This post may have been removed.</p>
             <Button asChild className="mt-4" variant="outline">
                <Link href="/updates">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Updates
                </Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
        <div>
            <Button asChild variant="outline">
                <Link href="/updates">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Updates
                </Link>
            </Button>
        </div>
      <Card>
         {update.imageUrl && (
            <div className="relative h-64 sm:h-80 md:h-96 w-full">
                <Image 
                    src={update.imageUrl} 
                    alt={update.title} 
                    layout="fill"
                    objectFit="cover"
                    className="rounded-t-lg"
                    data-ai-hint="construction industry news"
                />
            </div>
        )}
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold font-headline">{update.title}</CardTitle>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
                <RoleIcon role={update.authorRole} />
                <span>By {update.authorName}</span>
            </div>
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Posted on {formatDate(update.createdAt)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-base leading-relaxed">{update.content}</p>
        </CardContent>
      </Card>
    </div>
  );
}
