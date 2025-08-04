

'use client';

import { useAuth, markAllNotificationsAsRead } from '@/lib/store';
import { useEffect, useState, useCallback } from 'react';
import type { Notification } from '@/lib/types';
import { onSnapshot, query, collection, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck, FileText, Newspaper, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Image from 'next/image';

function NotificationListSkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                </div>
            ))}
        </div>
    )
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
    switch (type) {
        case 'quote':
            return <FileText className="h-5 w-5 text-primary" />;
        case 'requirement':
            return <Newspaper className="h-5 w-5 text-primary" />;
        case 'admin_update':
            return <Bell className="h-5 w-5 text-primary" />;
        case 'purchase':
            return <ShoppingCart className="h-5 w-5 text-accent" />;
        default:
            return <Bell className="h-5 w-5 text-primary" />;
    }
}

export default function NotificationsPage() {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const markAsRead = useCallback(async () => {
        if (currentUser?.id) {
            await markAllNotificationsAsRead(currentUser.id);
        }
    }, [currentUser?.id]);


    useEffect(() => {
        if (!currentUser?.id) {
            setLoading(false);
            return;
        };

        markAsRead(); // Mark as read when the component mounts

        const q = query(
            collection(db, "notifications"),
            where("userId", "==", currentUser.id),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setNotifications(notifs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser?.id, markAsRead]);
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline tracking-tight">Notifications</h1>
                <p className="text-muted-foreground">All your updates and alerts in one place.</p>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                     {loading ? (
                        <NotificationListSkeleton />
                    ) : notifications.length > 0 ? (
                        <div className="space-y-3">
                            {notifications.map(notif => (
                                <Link key={notif.id} href={notif.link} className="block">
                                    <div className={cn(
                                        "flex items-center gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/50",
                                        !notif.read && "bg-secondary"
                                    )}>
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <NotificationIcon type={notif.type} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm">{notif.message}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                            </p>
                                        </div>
                                         {!notif.read && (
                                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" title="Unread"></div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="mx-auto w-24 h-24 mb-4">
                               <Image src="https://placehold.co/100x100.png" width={100} height={100} alt="No notifications" data-ai-hint="empty box document" className="rounded-full" />
                           </div>
                           <h3 className="text-lg font-medium">All Caught Up</h3>
                           <p className="text-muted-foreground mt-1">You have no new notifications.</p>
                       </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
