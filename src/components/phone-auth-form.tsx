
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


  const onSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Clear any previous verifier
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
    
    const formattedPhone = `+91${phone.trim()}`;

    try {
      const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal', // Use 'normal' for the visible widget
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
      });

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      window.confirmationResult = confirmationResult;
      setShowOtpInput(true);
      toast.success('OTP sent successfully!');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      let errorMessage = 'Failed to send OTP. Please check the number and try again.';
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please ensure you enter a valid 10-digit number.';
      } else if (error.code === 'auth/captcha-check-failed') {
          errorMessage = "reCAPTCHA check failed. Please ensure you're not in an incognito window or using a VPN, and that your domain is authorized in the Firebase Console."
      }
      toast.error(errorMessage);
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
      
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        toast.success('Login Successful!');
      } else {
        setShowRoleSelector(true);
        setShowOtpInput(false);
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
    } catch (error) {
        console.error("Failed to create user profile:", error);
        toast.error("An error occurred during registration. Please try again.");
    } finally {
        setLoading(false);
    }
  }

  return (
    <>
      <Toaster toastOptions={{
          className: 'bg-background text-foreground border rounded-md',
      }}/>

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
          {/* This container is where the reCAPTCHA widget will render */}
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
