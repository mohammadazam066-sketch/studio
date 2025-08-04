
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { markNotificationsAsRead } from "@/lib/store";
import type { Notification } from "@/lib/types";
import { onSnapshot, query, collection, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from "./ui/skeleton";

interface NotificationsMenuProps {
    userId: string;
}

function NotificationSkeleton() {
    return (
        <div className="flex flex-col gap-2 p-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5 rounded-md p-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            ))}
        </div>
    )
}

export function NotificationsMenu({ userId }: NotificationsMenuProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        if (!userId) return;

        setLoading(true);
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(20) // Limit to the last 20 notifications to avoid performance issues
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setNotifications(notifs);
            setHasUnread(notifs.some(n => !n.read));
            setLoading(false);
        });

        return () => unsubscribe();

    }, [userId]);

    const handleOpenChange = async (open: boolean) => {
        if (open && hasUnread) {
            // Mark all visible notifications as read when menu is opened
            const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
            if (unreadIds.length > 0) {
                await markNotificationsAsRead(unreadIds);
                setHasUnread(false); // Optimistically update UI
            }
        }
    }


    return (
        <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10">
                    <Bell className="h-5 w-5" />
                     {hasUnread && (
                        <span className="absolute top-2 right-2 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                     )}
                     <span className="sr-only">Toggle notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    {loading ? (
                        <NotificationSkeleton />
                    ) : notifications.length > 0 ? (
                        notifications.map(notif => (
                            <Link key={notif.id} href={notif.link} passHref>
                                <DropdownMenuItem className="flex-col items-start whitespace-normal cursor-pointer">
                                    <p className="text-sm">{notif.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}
                                    </p>
                                </DropdownMenuItem>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center text-sm text-muted-foreground p-4">
                            You have no notifications.
                        </div>
                    )}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
