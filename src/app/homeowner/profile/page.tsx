import { UserProfileForm } from "@/components/user-profile-form";

export default function HomeownerProfilePage() {
  // In a real app, you'd get the user from a session.
  const user = {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Keep your personal information up to date.</p>
      </div>
      <UserProfileForm user={user} />
    </div>
  );
}
