

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Briefcase, FileText, Newspaper, Home, Store } from 'lucide-react';
import type { UserRole } from '@/lib/types';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator } from '@/components/ui/sidebar';

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
  { href: '/shop-owner/my-quotations', label: 'My Quotations', icon: FileText },
];

const sharedNavLinks: NavLink[] = [
    { href: '/updates', label: 'Updates', icon: Newspaper },
];

const homeLink: NavLink = { href: '/', label: 'Main Page', icon: Home };

export function SidebarNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const navLinks = role === 'homeowner' ? homeownerNavLinks : shopOwnerNavLinks;

  const otherRoleLink = role === 'homeowner' 
    ? { href: '/shop-owner/dashboard', label: 'Shop Owner View', icon: Store }
    : { href: '/homeowner/dashboard', label: 'Homeowner View', icon: Home };

  return (
    <SidebarMenu>
      {navLinks.map((link) => (
        <SidebarMenuItem key={link.href}>
          <Link href={link.href}>
            <SidebarMenuButton isActive={pathname.startsWith(link.href)} tooltip={link.label}>
              <link.icon />
              <span>{link.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
      
      <SidebarSeparator />

      {sharedNavLinks.map((link) => (
         <SidebarMenuItem key={link.href}>
          <Link href={link.href}>
            <SidebarMenuButton isActive={pathname.startsWith(link.href)} tooltip={link.label}>
              <link.icon />
              <span>{link.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
      
      <SidebarSeparator />

      <SidebarMenuItem>
        <Link href={otherRoleLink.href}>
          <SidebarMenuButton isActive={pathname.startsWith(otherRoleLink.href)} tooltip={otherRoleLink.label}>
            <otherRoleLink.icon />
            <span>{otherRoleLink.label}</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <Link href={homeLink.href}>
          <SidebarMenuButton isActive={pathname === homeLink.href} tooltip={homeLink.label}>
            <homeLink.icon />
            <span>{homeLink.label}</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>

    </SidebarMenu>
  );
}
