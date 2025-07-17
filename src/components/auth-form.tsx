

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useAuth } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import type { UserRole, User } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getUser } from '@/lib/store';

interface AuthFormProps {
  mode: 'login' | 'register';
  role: UserRole;
}

export function AuthForm({ mode, role }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // This effect handles redirection once authentication state is confirmed.
    if (!authLoading && currentUser) {
      const dashboardUrl = currentUser.role === 'homeowner' ? '/homeowner/dashboard' : '/shop-owner/dashboard';
      router.push(dashboardUrl);
    }
  }, [currentUser, authLoading, router]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      if (mode === 'register') {
        await register(username, password, role);
        toast({
          title: "Registration successful!",
          description: "Welcome to Bidarkart.",
        });
        // The useEffect will handle redirection on successful registration
      } else { // Login mode
        await login(username, password);
        // The useEffect hook will detect the change in currentUser 
        // and handle redirection. No need for further action here.
      }
    } catch (e: any) {
      let errorMessage = e.message || "An error occurred. Please try again.";
      if (typeof e.message === 'string') {
        if (e.message.includes('auth/invalid-credential') || e.message.includes('auth/wrong-password') || e.message.includes('auth/user-not-found')) {
          errorMessage = "Invalid username or password.";
        } else if (e.message.includes('auth/email-already-in-use')) {
          errorMessage = "A user with this username already exists.";
        } else if (e.message.includes('auth/invalid-email')) {
          errorMessage = "The username format is not valid. Please try again.";
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
            <Button className={`w-full ${mode === 'register' ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`} type="submit" disabled={loading || authLoading}>
              {(loading || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {buttonText}
            </Button>
            <div className="text-sm text-muted-foreground">
              {footerText}{' '}
              <Link href={footerLink} className="underline text-primary">
                {footerLinkText}
              </Link>
            </div>
             { mode === 'login' &&
              <div className="text-sm text-muted-foreground text-center">
                <span>Trying to log in as a {role === 'homeowner' ? 'Shop Owner' : 'Homeowner'}? </span>
                <Link href={`/auth-pages/login?role=${role === 'homeowner' ? 'shop-owner' : 'homeowner'}`} className="underline text-primary">
                  Click here
                </Link>
              </div>
            }
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
