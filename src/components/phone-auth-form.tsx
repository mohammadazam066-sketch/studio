
'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { useAuth } from '@/lib/store';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

// Firebase provides test numbers to avoid rate limits during development
const FIREBASE_TEST_PHONE_NUMBER_SHORT = '6505553434';

export function PhoneAuthForm() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [role, setRole] = useState<UserRole>('homeowner');
  const { handleNewUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // This effect sets up the reCAPTCHA verifier when the component mounts.
    // It's set to 'invisible' so the user doesn't have to click anything.
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      },
      'expired-callback': () => {
         toast({
            variant: "destructive",
            title: "reCAPTCHA Expired",
            description: "Please solve the reCAPTCHA again.",
        });
      },
    });
    
    window.recaptchaVerifier = verifier;

    // Cleanup the verifier when the component unmounts
    return () => {
      window.recaptchaVerifier?.clear();
    };
  }, [toast]);


  const onSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!/^\d{10}$/.test(phone)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number.',
      });
      setLoading(false);
      return;
    }
    
    const appVerifier = window.recaptchaVerifier;
    if (!appVerifier) {
         toast({
            variant: "destructive",
            title: "reCAPTCHA Error",
            description: "reCAPTCHA verifier not initialized. Please refresh the page.",
        });
        setLoading(false);
        return;
    }

    const formattedPhone = `+91${phone}`;
    
    // For test numbers, Firebase recommends not using the app verifier.
    const verifierForSignIn = phone === FIREBASE_TEST_PHONE_NUMBER_SHORT ? null : appVerifier;

    try {
      // @ts-ignore - The 'null' verifier is valid for test numbers, but TS doesn't know that.
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifierForSignIn);
      window.confirmationResult = confirmationResult;
      setShowOtpInput(true);
      toast({
        title: 'OTP Sent!',
        description: 'Please check your phone for the verification code.',
      });
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      let errorMessage = 'Failed to send OTP. Please try again.';
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'The phone number format is invalid. Please check and try again.';
      } else if (error.code === 'auth/captcha-check-failed') {
          errorMessage = "reCAPTCHA check failed. Ensure your domain is authorized in the Firebase Console (Authentication > Settings > Authorized domains)."
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "You've made too many requests. Please wait a while before trying again."
      } else if (error.code === 'auth/internal-error') {
        errorMessage = "An internal error occurred. Please try again."
      }
      toast({
          variant: 'destructive',
          title: 'OTP Send Error',
          description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!window.confirmationResult) {
      toast({
        variant: "destructive",
        title: "Verification Error",
        description: "Confirmation result not found. Please try sending the OTP again.",
      });
      setLoading(false);
      return;
    }

    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;
      
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        toast({ title: 'Login Successful!' });
      } else {
        setShowRoleSelector(true);
        setShowOtpInput(false);
        toast({ title: "Welcome!", description: "Please select your role to complete registration."});
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
          variant: "destructive",
          title: "Invalid OTP",
          description: "The OTP you entered is incorrect. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };
  
  const onSelectRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "No authenticated user found. Please restart the login process.",
        });
        setLoading(false);
        return;
    }
    
    try {
        await handleNewUser(user, role);
        toast({ title: "Registration complete! Welcome to TradeFlow." });
    } catch (error) {
        console.error("Failed to create user profile:", error);
        toast({
            variant: "destructive",
            title: "Registration Failed",
            description: "An error occurred during registration. Please try again.",
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <>
      {/* This empty div is required for the invisible reCAPTCHA to work */}
      <div id="recaptcha-container"></div>
      {!showOtpInput && !showRoleSelector && (
        <form onSubmit={onSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-secondary text-sm text-muted-foreground h-10">
                +91
              </span>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="rounded-l-none"
              />
            </div>
             {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-muted-foreground pt-1">
                Hint: Use test number `6505553434` with OTP `123456` to avoid SMS limits.
              </p>
            )}
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
