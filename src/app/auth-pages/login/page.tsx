import { AuthForm } from '@/components/auth-form';
import type { UserRole } from '@/lib/types';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { role: string };
}) {
  const role: UserRole = searchParams.role === 'shop-owner' ? 'shop-owner' : 'homeowner';

  return <AuthForm mode="login" role={role} />;
}
