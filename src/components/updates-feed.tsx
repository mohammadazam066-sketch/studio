
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getUpdates, useAuth } from '@/lib/store';
import type { Update, UserRole } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User, Store, Bot } from 'lucide-react';
import Image from 'next/image';

function formatFirebaseDate(date: Date | string | Timestamp) {
    if (!date) return '';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return formatDistanceToNow(dateObj, { addSuffix: true });
}

function RoleIcon({ role }: { role: UserRole }) {
    if (role === 'homeowner') return <User className="h-4 w-4 text-muted-foreground" />;
    if (role === 'shop-owner') return <Store className="h-4 w-4 text-muted-foreground" />;
    return <Bot className="h-4 w-4 text-muted-foreground" />;
}

function FeedSkeleton() {
  return (
    <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
            <Card key={i}>
                {i % 2 !== 0 && <Skeleton className="h-48 w-full rounded-t-lg" />}
                <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                </CardContent>
            </Card>
        ))}
    </div>
  );
}

export function UpdatesFeed({ refreshKey }: { refreshKey: number }) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    const fetchedUpdates = await getUpdates();
    setUpdates(fetchedUpdates);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates, refreshKey]);

  if (loading) {
     return <FeedSkeleton />;
  }

  return (
    <div className="space-y-6">
      {updates.length > 0 ? (
        updates.map(update => (
          <Card key={update.id}>
             {update.imageUrl && (
                <div className="relative h-48 w-full">
                    <Image 
                        src={update.imageUrl} 
                        alt={update.title} 
                        layout="fill"
                        objectFit="cover"
                        className="rounded-t-lg"
                        data-ai-hint="construction industry"
                    />
                </div>
            )}
            <CardHeader>
              <CardTitle>{update.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <RoleIcon role={update.authorRole} />
                    <span>{update.authorName}</span>
                </div>
                <span>{formatFirebaseDate(update.createdAt)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{update.content}</p>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-medium">The Feed is Quiet...</h2>
          <p className="text-muted-foreground mt-2">Be the first to share an update with the community!</p>
        </div>
      )}
    </div>
  );
}
