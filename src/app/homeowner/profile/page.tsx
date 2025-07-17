
'use client';
import { UserProfileForm } from "@/components/user-profile-form";
import { useAuth } from "@/lib/store.tsx";
import { Skeleton } from '@/components/ui/skeleton';

export default function HomeownerProfilePage() {
  const { currentUser, loading } = useAuth();

  if (loading || !currentUser) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Keep your personal information up to date.</p>
      </div>
      <UserProfileForm />
    </div>
  );
}
