
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Briefcase, User, FileText, LogOut, Newspaper } from 'lucide-react';
import type { UserRole } from '@/lib/types';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useAuth } from '@/lib/store';

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
}

const homeownerNavLinks: NavLink[] = [
  { href: '/homeowner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/homeowner/requirements/new', label: 'New Requirement', icon: PlusCircle },
  { href: '/updates', label: 'Updates', icon: Newspaper },
  { href: '/homeowner/profile', label: 'Profile', icon: User },
];

const shopOwnerNavLinks: NavLink[] = [
  { href: '/shop-owner/dashboard', label: 'Requirements', icon: Briefcase },
  { href: '/shop-owner/my-quotations', label: 'My Quotations', icon: FileText },
  { href: '/updates', label: 'Updates', icon: Newspaper },
  { href: '/shop-owner/profile', label: 'Profile', icon: User },
];

export function SidebarNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const navLinks = role === 'homeowner' ? homeownerNavLinks : shopOwnerNavLinks;

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

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
      <SidebarMenuItem>
        <SidebarMenuButton onClick={handleLogout} tooltip="Log Out">
            <LogOut />
            <span>Log Out</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
