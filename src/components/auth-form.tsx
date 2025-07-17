
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useAuth, getUser } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/types';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getAuth } from 'firebase/auth';

interface AuthFormProps {
  mode: 'login' | 'register';
  role: UserRole;
}

export function AuthForm({ mode, role }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // Use a domain for internal email construction
    const email = `${username.toLowerCase()}@tradeflow.app`;

    try {
      if (mode === 'register') {
        await register(username, password, role);
        toast({
          title: "Registration successful!",
          description: "Welcome to TradeFlow.",
        });
        const dashboardUrl = role === 'homeowner' ? '/homeowner/dashboard' : '/shop-owner/dashboard';
        router.push(dashboardUrl);
      } else { // Login mode
        await login(username, password);
        
        const user = getAuth().currentUser;
        if (!user) {
          throw new Error("Could not retrieve user after login.");
        }
        
        const userProfile = await getUser(user.uid);
        if (userProfile) {
          const dashboardUrl = userProfile.role === 'homeowner' ? '/homeowner/dashboard' : '/shop-owner/dashboard';
          router.push(dashboardUrl);
        } else {
          await getAuth().signOut();
          throw new Error("User profile could not be found. Please try registering or contact support.");
        }
      }
      
      router.refresh(); 

    } catch (e: any) {
      let errorMessage = e.message || "An error occurred. Please try again.";
       if (typeof e.message === 'string') {
        if (e.message.includes('auth/invalid-credential') || e.message.includes('auth/wrong-password') || e.message.includes('auth/user-not-found')) {
           errorMessage = "Invalid username or password.";
        } else if (e.message.includes('auth/email-already-in-use')) {
           errorMessage = "A user with this username already exists.";
        } else if (e.message.includes('auth/invalid-email')) {
           errorMessage = "Username is not valid. Please use only letters, numbers, and underscores.";
        }
      }
      
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: `${mode === 'login' ? 'Login' : 'Registration'} Failed`,
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'login' ? 'Welcome Back' : 'Create an Account';
  const description = `Enter your credentials to ${mode} as a ${role.replace('-', ' ')}.`;
  const buttonText = mode === 'login' ? 'Log In' : 'Register';
  const footerLink = mode === 'login' ? `/auth-pages/register?${searchParams.toString()}` : `/auth-pages/login?${searchParams.toString()}`;
  const footerText = mode === 'login' ? "Don't have an account?" : 'Already have an account?';
  const footerLinkText = mode === 'login' ? 'Sign up' : 'Log in';

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Logo />
            </div>
            <CardTitle className="font-headline">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" placeholder="Choose a username" required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required disabled={loading} />
            </div>
            {error && <p className="text-sm text-center text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className={`w-full ${mode === 'register' ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`} type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {buttonText}
            </Button>
            <div className="text-sm text-muted-foreground">
              {footerText}{' '}
              <Link href={footerLink} className="underline text-primary">
                {footerLinkText}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
