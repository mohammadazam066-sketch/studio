
'use client';
import { UserProfileForm } from "@/components/user-profile-form";
import { useAuth } from "@/lib/store.tsx";

export default function HomeownerProfilePage() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <div>Loading...</div>; // Or redirect, or a skeleton loader
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
