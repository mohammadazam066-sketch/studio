
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
    // This effect runs only when we need to show the phone number input.
    // It sets up the reCAPTCHA verifier.
    if (!showOtpInput && !showRoleSelector) {
        // Cleanup previous instance if it exists
        window.recaptchaVerifier?.clear();
        
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'normal',
            'callback': (response: any) => {
              // reCAPTCHA solved, allow user to proceed
            },
            'expired-callback': () => {
              // Response expired. Ask user to solve reCAPTCHA again.
              toast({
                  variant: "destructive",
                  title: "reCAPTCHA Expired",
                  description: "Please solve the reCAPTCHA again.",
              });
            }
        });
        window.recaptchaVerifier = verifier;

        // Cleanup function to clear the verifier when the component unmounts
        // or when we move to the OTP/Role stage.
        return () => {
            verifier.clear();
        }
    }
  }, [showOtpInput, showRoleSelector, toast]);


  const onSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const phoneNumber = phone.trim();
    if (!/^\d{10}$/.test(phoneNumber)) {
        toast({
            variant: "destructive",
            title: "Invalid Phone Number",
            description: "Please enter a valid 10-digit phone number.",
        });
        setLoading(false);
        return;
    }
    
    if (!window.recaptchaVerifier) {
        toast({
            variant: "destructive",
            title: "reCAPTCHA Error",
            description: "reCAPTCHA not initialized. Please wait a moment and try again.",
        });
        setLoading(false);
        return;
    }
    
    const formattedPhone = `+91${phoneNumber}`;
    const appVerifier = window.recaptchaVerifier;

    try {
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
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
          errorMessage = "reCAPTCHA check failed. Please ensure your domain (e.g., localhost) is authorized in the Firebase Console under Authentication > Settings > Authorized domains."
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "You've made too many requests. Please wait a while before trying again."
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
          </div>
          <div id="recaptcha-container" className="flex justify-center"></div>
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
