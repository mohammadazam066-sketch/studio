import { ShopOwnerProfileForm } from "@/components/shop-owner-profile-form";

export default function ShopOwnerProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Keep your business information up to date.</p>
      </div>
      <ShopOwnerProfileForm />
    </div>
  );
}
