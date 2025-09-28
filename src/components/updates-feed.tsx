

'use client';

import { getAllUpdates } from '@/lib/store';
import { useEffect, useState, useCallback } from 'react';
import type { Update, UserRole } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { User, Store, Bot, Calendar, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';

function formatDate(date: Date | string | Timestamp) {
    if (!date) return 'Unknown date';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP');
}

function FeedSkeleton() {
    return (
        <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <div className="flex items-center gap-4">
                           <Skeleton className="h-5 w-1/4" />
                           <Skeleton className="h-5 w-1/4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6 mt-2" />
                    </CardContent>
                     <CardFooter>
                        <Skeleton className="h-9 w-32" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

function RoleIcon({ role }: { role: UserRole }) {
    if (role === 'homeowner') return <User className="h-4 w-4 text-muted-foreground" />;
    if (role === 'shop-owner') return <Store className="h-4 w-4 text-muted-foreground" />;
    return <Bot className="h-4 w-4 text-muted-foreground" />;
}

export function UpdatesFeed({ refreshKey }: { refreshKey: number }) {
    const [updates, setUpdates] = useState<Update[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUpdates = useCallback(async () => {
        setLoading(true);
        const allUpdates = await getAllUpdates();
        setUpdates(allUpdates);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchUpdates();
    }, [fetchUpdates, refreshKey]);

    if (loading) {
        return <FeedSkeleton />;
    }

    if (updates.length === 0) {
        return (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <div className="mx-auto w-24 h-24 mb-4">
                    <Image src="https://placehold.co/100x100.png" width={100} height={100} alt="No updates" data-ai-hint="empty box document" className="rounded-full" />
                </div>
                <h3 className="text-lg font-medium">No updates yet</h3>
                <p className="text-muted-foreground mt-1">Be the first to share something with the community!</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {updates.map(update => (
                <Card key={update.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl font-headline">
                             <Link href={`/updates/${update.id}`} className="hover:text-primary transition-colors">
                                {update.title}
                            </Link>
                        </CardTitle>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground pt-1">
                            <div className="flex items-center gap-2">
                                <RoleIcon role={update.authorRole} />
                                <span>{update.authorName}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(update.createdAt)}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground line-clamp-3">{update.content}</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="secondary">
                            <Link href={`/updates/${update.id}`}>
                                Read More <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
