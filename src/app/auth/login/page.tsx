
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
          {/* We only need one content area now, as the form is shared */}
          <TabsContent value={tab}>
             <Card className="border-0 shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="text-xl">{titles[tab]}</CardTitle>
                <CardDescription>
                  {descriptions[tab]}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                {/* A single PhoneAuthForm is rendered, its key changes to reset state when tab switches */}
                <PhoneAuthForm key={tab} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground text-center w-full">
          Need help? Contact <a href="mailto:tradeflow.kart@gmali.com" className="underline hover:text-primary">tradeflow.kart@gmali.com</a>
        </p>
      </CardFooter>
    </Card>
  );
}
