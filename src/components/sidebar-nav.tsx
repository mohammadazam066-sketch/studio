'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Briefcase, User } from 'lucide-react';
import type { UserRole } from '@/lib/types';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
}

const homeownerNavLinks: NavLink[] = [
  { href: '/homeowner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/homeowner/requirements/new', label: 'New Requirement', icon: PlusCircle },
];

const shopOwnerNavLinks: NavLink[] = [
  { href: '/shop-owner/dashboard', label: 'Requirements', icon: Briefcase },
  { href: '/shop-owner/profile', label: 'Profile', icon: User },
];

export function SidebarNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const navLinks = role === 'homeowner' ? homeownerNavLinks : shopOwnerNavLinks;

  return (
    <SidebarMenu>
      {navLinks.map((link) => (
        <SidebarMenuItem key={link.href}>
          <Link href={link.href}>
            <SidebarMenuButton isActive={pathname === link.href} tooltip={link.label}>
              <link.icon />
              <span>{link.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
