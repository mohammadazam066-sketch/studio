
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, getNotifications, markNotificationsAsRead } from '@/lib/store';
import type { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function formatFirebaseDate(date: Date | string | Timestamp) {
    if (!date) return 'Just now';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return formatDistanceToNow(dateObj, { addSuffix: true });
}

function NotificationSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
            <CardContent className="p-4 flex items-start gap-4">
                <Skeleton className="h-8 w-8 rounded-full mt-1" />
                <div className="flex-grow space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
            </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    const fetchedNotifications = await getNotifications(currentUser.id);
    setNotifications(fetchedNotifications);
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  useEffect(() => {
    // Mark notifications as read when the component mounts
    if (currentUser) {
      markNotificationsAsRead(currentUser.id);
    }
  }, [currentUser]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <div>
        <h1 className="text-2xl font-bold font-headline tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Here are your recent updates and alerts.</p>
      </div>

      {loading ? (
        <NotificationSkeleton />
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map(notification => (
            <Link href={notification.link} key={notification.id} className="block">
                <Card className={`transition-all hover:shadow-md ${!notification.read ? 'border-primary/50' : 'border-transparent'}`}>
                    <CardContent className="p-4 flex items-start gap-4">
                        <div className={`mt-1 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${!notification.read ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <Bell className="h-5 w-5" />
                        </div>
                        <div className="flex-grow">
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatFirebaseDate(notification.createdAt)}</p>
                        </div>
                    </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-medium">No notifications yet</h2>
          <p className="text-muted-foreground mt-2">We'll let you know when something important happens.</p>
        </div>
      )}
    </div>
  );
}
