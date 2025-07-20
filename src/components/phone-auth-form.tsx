
'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { useAuth } from '@/lib/store';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { UserRole } from '@/lib/types';
import toast, { Toaster } from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export function PhoneAuthForm() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [role, setRole] = useState<UserRole>('homeowner');
  const { handleNewUser } = useAuth();


  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
      });
    }
  };

  const onSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setupRecaptcha();
    
    try {
      const appVerifier = window.recaptchaVerifier!;
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      window.confirmationResult = confirmationResult;
      setShowOtpInput(true);
      toast.success('OTP sent successfully!');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send OTP. Please check the number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!window.confirmationResult) {
      toast.error("Confirmation result not found. Please try again.");
      setLoading(false);
      return;
    }

    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        toast.success('Login Successful!');
        // User exists, redirect is handled by AuthLayout
      } else {
        // New user, show role selector
        setShowRoleSelector(true);
        setShowOtpInput(false); // Hide OTP input
        toast("Welcome! Please select your role.");
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const onSelectRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
        toast.error("No authenticated user found. Please restart the login process.");
        setLoading(false);
        return;
    }
    
    try {
        await handleNewUser(user, role);
        toast.success("Registration complete! Welcome to TradeFlow.");
        // Redirect will be handled by AuthLayout
    } catch (error) {
        console.error("Failed to create user profile:", error);
        toast.error("An error occurred during registration. Please try again.");
    } finally {
        setLoading(false);
    }
  }

  return (
    <>
      <div id="recaptcha-container"></div>
      <Toaster toastOptions={{
          className: 'bg-background text-foreground border rounded-md',
      }}/>

      {!showOtpInput && !showRoleSelector && (
        <form onSubmit={onSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 12345 67890"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : 'Send OTP'}
            <ArrowRight className="ml-2" />
          </Button>
        </form>
      )}

      {showOtpInput && (
        <form onSubmit={onVerifyOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="123456"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : 'Verify OTP'}
          </Button>
        </form>
      )}
      
      {showRoleSelector && (
        <form onSubmit={onSelectRole} className="space-y-6">
            <div className="space-y-2">
             <Label>I am a...</Label>
              <RadioGroup defaultValue="homeowner" className="flex gap-4 pt-2" onValueChange={(value: UserRole) => setRole(value)} disabled={loading}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="homeowner" id="r1" />
                  <Label htmlFor="r1">Homeowner</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="shop-owner" id="r2" />
                  <Label htmlFor="r2">Shop Owner</Label>
                </div>
              </RadioGroup>
          </div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Complete Registration'}
            </Button>
        </form>
      )}
    </>
  );
}
