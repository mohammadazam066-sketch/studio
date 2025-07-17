

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useAuth } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';


const formatUsernameForFirebase = (username: string) => {
    const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (!sanitizedUsername) {
        throw new Error("Username is invalid. Please use only letters, numbers, underscores, periods, or hyphens.");
    }
    return {
      sanitizedUsername,
      emailForFirebase: `${sanitizedUsername}@bidarkart.app`
    };
}


interface AuthFormProps {
  mode: 'login' | 'register';
  role: UserRole;
}

export function AuthForm({ mode, role }: AuthFormProps) {
  const router = useRouter();
  const { login, register, currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
      const { sanitizedUsername, emailForFirebase } = formatUsernameForFirebase(username);
      
      const originalUsername = username;

      if (mode === 'register') {
        await register(emailForFirebase, password, role, sanitizedUsername);
        toast({
          title: "Registration successful!",
          description: "Welcome to Bidarkart. You can now log in.",
        });
        router.push(`/auth-pages/login?role=${role}`);

      } else { 
        await login(emailForFirebase, password);
      }
    } catch (e: any) {
       let errorMessage = "An error occurred. Please try again.";
       if (e?.code) {
           switch (e.code) {
               case 'auth/invalid-credential':
               case 'auth/wrong-password':
               case 'auth/user-not-found':
                   errorMessage = "Invalid username or password.";
                   break;
               case 'auth/email-already-in-use':
                   errorMessage = "This username is already taken. Please try another.";
                   break;
               case 'auth/weak-password':
                   errorMessage = "Password should be at least 6 characters.";
                   break;
               case 'auth/invalid-email':
                   errorMessage = "The username format is not valid. Please try again.";
                   break;
               default:
                   errorMessage = e.message; 
                   break;
           }
       } else if (e.message) {
         errorMessage = e.message;
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
  const footerLink = mode === 'login' ? `/auth-pages/register?role=${role}` : `/auth-pages/login?role=${role}`;
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
              <Input id="username" name="username" type="text" placeholder="e.g. johndoe" required disabled={loading} />
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
             {mode === 'login' && role === 'homeowner' && (
              <div className="text-sm">
                  <span>
                    Shop Owner?{' '}
                    <Link href="/auth-pages/login?role=shop-owner" className="underline text-primary">
                      Log in here
                    </Link>
                  </span>
              </div>
            )}
             {mode === 'login' && role === 'shop-owner' && (
              <div className="text-sm">
                  <span>
                    Homeowner?{' '}
                    <Link href="/auth-pages/login?role=homeowner" className="underline text-primary">
                      Log in here
                    </Link>
                  </span>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
