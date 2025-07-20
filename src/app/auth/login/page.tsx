
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneAuthForm } from '@/components/phone-auth-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome!</CardTitle>
        <CardDescription>
          Sign in or create an account to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
             <Card className="border-0 shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="text-xl">Sign In</CardTitle>
                <CardDescription>
                  Enter your phone number to receive a one-time password.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <PhoneAuthForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
             <Card className="border-0 shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="text-xl">Create an Account</CardTitle>
                <CardDescription>
                  It's quick and easy. Just enter your phone number to begin.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <PhoneAuthForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
