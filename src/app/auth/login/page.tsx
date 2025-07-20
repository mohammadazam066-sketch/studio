
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneAuthForm } from '@/components/phone-auth-form';


export default function LoginPage() {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome!</CardTitle>
        <CardDescription>Enter your phone number to sign in or create an account.</CardDescription>
      </CardHeader>
      <CardContent>
        <PhoneAuthForm />
      </CardContent>
    </Card>
  );
}
