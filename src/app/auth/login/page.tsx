
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PhoneAuthForm } from '@/components/phone-auth-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from 'react';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  const titles = {
    login: 'Sign In',
    signup: 'Create an Account'
  };

  const descriptions = {
    login: 'Enter your phone number to receive a one-time password.',
    signup: "It's quick and easy. Just enter your phone number to begin."
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome!</CardTitle>
        <CardDescription>
          Sign in or create an account to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full" onValueChange={(value) => setTab(value as 'login' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
             <Card className="border-0 shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="text-xl">{titles.login}</CardTitle>
                <CardDescription>
                  {descriptions.login}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <PhoneAuthForm key="login" />
              </CardContent>
            </Card>
          </TabsContent>
          
           <TabsContent value="signup">
             <Card className="border-0 shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="text-xl">{titles.signup}</CardTitle>
                <CardDescription>
                  {descriptions.signup}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <PhoneAuthForm key="signup" />
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground text-center w-full">
          Need help? Contact <a href="mailto:tradeflow.kart@gmail.com" className="underline hover:text-primary">tradeflow.kart@gmail.com</a>
        </p>
      </CardFooter>
    </Card>
  );
}
