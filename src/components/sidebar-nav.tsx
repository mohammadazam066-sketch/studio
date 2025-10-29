

'use client';

import {
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarSeparator,
    SidebarMenuBadge
} from '@/components/ui/sidebar';
import { Logo } from './logo';
import { UserNav } from './user-nav';
import type { User, UserRole, Notification } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { Home, List, FileText, User as UserIcon, LogIn, Newspaper, Eye, ShieldCheck, Users, Bell } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/store';
import { useState, useEffect } from 'react';
import { onSnapshot, query, collection, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';


type NavItem = {
    href: string;
    label: string;
    icon: React.ElementType;
    roles: (UserRole | 'guest')[];
    isNotification?: boolean;
};

const navItems: NavItem[] = [
    { href: '/homeowner/dashboard', label: 'Dashboard', icon: Home, roles: ['homeowner', 'guest'] },
    { href: '/shop-owner/dashboard', label: 'Dashboard', icon: Home, roles: ['shop-owner'] },
    { href: '/shop-owner/requirements', label: 'Open Requirements', icon: Eye, roles: ['shop-owner'] },
    { href: '/shop-owner/my-quotations', label: 'My Quotations', icon: FileText, roles: ['shop-owner'] },
    { href: '/updates', label: 'Updates', icon: Newspaper, roles: ['homeowner', 'shop-owner', 'admin', 'guest'] },
    { href: '/notifications', label: 'Notifications', icon: Bell, roles: ['homeowner', 'shop-owner'], isNotification: true },
    { href: '/admin/dashboard', label: 'Admin Panel', icon: ShieldCheck, roles: ['admin'] },
    { href: '/admin/users', label: 'Users', icon: Users, roles: ['admin'] },
];


export function SidebarNav({ user }: { user: User | null }) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    
    const userRole = user ? user.role : 'guest';
    const userNavItems = navItems.filter(item => item.roles.includes(userRole));
    
    useEffect(() => {
        if (!user?.id) return;
        
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", user.id),
            where("read", "==", false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [user?.id]);


    return (
        <>
            <SidebarHeader>
                <div className="flex w-full items-center justify-between">
                    <Logo />
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {userNavItems.map(item => (
                        <SidebarMenuItem key={item.href}>
                             <Link href={item.href}>
                                <SidebarMenuButton
                                    isActive={pathname.startsWith(item.href)}
                                    icon={item.icon}
                                    // @ts-ignore
                                    tooltip={{
                                        children: item.label,
                                    }}
                                >
                                    {item.label}
                                    {item.isNotification && unreadCount > 0 && (
                                        <SidebarMenuBadge>{unreadCount}</SidebarMenuBadge>
                                    )}
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                    {!user && (
                         <SidebarMenuItem>
                            <Link href="/auth/login">
                                <SidebarMenuButton icon={LogIn}>
                                    Login / Sign Up
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarContent>
             <SidebarFooter className="md:hidden">
                <SidebarSeparator />
                 {user && <UserNav user={user} />}
            </SidebarFooter>
        </>
    );
}
