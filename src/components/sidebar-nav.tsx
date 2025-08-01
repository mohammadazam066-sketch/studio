

'use client';

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarTrigger,
    SidebarSeparator
} from '@/components/ui/sidebar';
import { Logo } from './logo';
import { UserNav } from './user-nav';
import type { User, UserRole } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { Home, List, FileText, User as UserIcon, LogOut, Newspaper, Eye, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/store';


type NavItem = {
    href: string;
    label: string;
    icon: React.ElementType;
    roles: UserRole[];
};

const navItems: NavItem[] = [
    { href: '/homeowner/dashboard', label: 'Dashboard', icon: Home, roles: ['homeowner'] },
    { href: '/shop-owner/dashboard', label: 'Dashboard', icon: Home, roles: ['shop-owner'] },
    { href: '/shop-owner/requirements', label: 'Open Requirements', icon: Eye, roles: ['shop-owner'] },
    { href: '/shop-owner/my-quotations', label: 'My Quotations', icon: FileText, roles: ['shop-owner'] },
    { href: '/updates', label: 'Updates', icon: Newspaper, roles: ['homeowner', 'shop-owner'] },
    { href: '/admin/dashboard', label: 'Admin Panel', icon: ShieldCheck, roles: ['homeowner', 'shop-owner', 'admin'] },
];

export function SidebarNav({ user }: { user: User }) {
    const pathname = usePathname();
    const { logout } = useAuth();
    
    const userNavItems = navItems.filter(item => item.roles.includes(user.role));

    return (
        <>
            <SidebarHeader>
                <div className="flex w-full items-center justify-between">
                    <Logo />
                    <SidebarTrigger className="hidden md:flex" />
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {userNavItems.map(item => (
                        <SidebarMenuItem key={item.href}>
                             <Link href={item.href}>
                                <SidebarMenuButton
                                    isActive={pathname.startsWith(item.href) && (item.href !== '/shop-owner/dashboard' || pathname === '/shop-owner/dashboard')}
                                    icon={item.icon}
                                    // @ts-ignore
                                    tooltip={{
                                        children: item.label,
                                    }}
                                >
                                    {item.label}
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <SidebarSeparator />
                <UserNav user={user} />
            </SidebarFooter>
        </>
    );
}
