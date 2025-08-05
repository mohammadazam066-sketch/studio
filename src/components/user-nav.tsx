

'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/store";
import type { User, HomeownerProfile } from "@/lib/types";
import { LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";


export function UserNav({ user }: { user: User }) {
  const { logout } = useAuth();
  const router = useRouter();
  
  const getInitials = (name?: string, phone?: string) => {
    if (name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (phone) {
        return phone.slice(-2);
    }
    return 'U';
  }

  let profileLink = '/';
  if (user.role === 'homeowner') {
    profileLink = '/homeowner/profile';
  } else if (user.role === 'shop-owner') {
    profileLink = '/shop-owner/profile';
  } else if (user.role === 'admin') {
    profileLink = '/admin/profile';
  }

  const displayName = user.profile?.name || user.phoneNumber;

  const handleLogout = async () => {
    await logout();
    // Redirect to the welcome page and force a full refresh
    // to clear any stale application state.
    router.push('/goodbye');
  }

  const homeownerProfile = user.role === 'homeowner' ? user.profile as HomeownerProfile : undefined;

  return (
    <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                {homeownerProfile?.photoURL && (
                    <AvatarImage src={homeownerProfile.photoURL} alt={displayName} />
                )}
                <AvatarFallback>{getInitials(user.profile?.name, user.phoneNumber)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.phoneNumber}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
               <Link href={profileLink}>
                <DropdownMenuItem className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    </div>
  )
}
