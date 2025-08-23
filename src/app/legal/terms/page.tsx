
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
                <CardTitle className="font-headline text-2xl">Terms, Conditions & Privacy Policy</CardTitle>
                <CardDescription>
                    Please review our policies before using the service.
                </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
                <Link href="/auth/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh] pr-6">
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground space-y-4">
                <h3 className="font-semibold text-foreground">kanstruction — TERMS & CONDITIONS</h3>
                
                <p className="text-xs">Effective Date: 23-07-2025</p>

                <h4 className="font-semibold text-foreground/90">1. Introduction</h4>
                <p>
                    Welcome to kanstruction (“we”, “our”, “us”). By accessing or using the kanstruction app or website (“tradeflow”), you agree to these Terms & Conditions (“Terms”). If you do not agree, do not use the Platform.
                </p>
                
                <h4 className="font-semibold text-foreground/90">2. Nature of the Platform</h4>
                <p>
                    kanstruction is a neutral online marketplace that connects homeowners, contractors, and shop owners for the purpose of buying and selling construction materials such as cement, steel, bricks, electrical items, and more.
                </p>
                <p>
                    kanstruction does not own, stock, transport, or sell any goods. It is solely a digital facilitator.
                </p>

                <h4 className="font-semibold text-foreground/90">3. User Responsibilities</h4>
                <p>You are solely responsible for the accuracy of information you provide.</p>
                <p>You are responsible for verifying the quality, quantity, and condition of materials before paying or accepting delivery.</p>
                <p>You must comply with all applicable local, state, and national laws.</p>
                
                <h4 className="font-semibold text-foreground/90">4. Payments & Delivery</h4>
                <p>All pricing, payment terms, delivery, and returns are solely agreed upon between the buyer and the seller.</p>
                <p>kanstruction does not handle payment collection, refunds, or delivery.</p>
                <p>Any disputes must be resolved directly between the parties involved.</p>

                <h4 className="font-semibold text-foreground/90">5. Limitation of Liability</h4>
                <div>
                    <p>
                        kanstruction, its owners, employees, or partners will not be liable for any loss, damage, dispute, or claim arising out of:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Transactions conducted through the Platform.</li>
                        <li>Delays, non-delivery, or defective goods.</li>
                        <li>Any misuse of the Platform by buyers or sellers.</li>
                    </ul>
                    <p>
                        You agree to indemnify and hold harmless kanstruction from any claims arising out of your use of the Platform.
                    </p>
                </div>
                
                <h4 className="font-semibold text-foreground/90">6. Termination</h4>
                <p>
                    kanstruction may suspend or terminate your access at any time for violation of these Terms or misuse of the Platform.
                </p>

                <h4 className="font-semibold text-foreground/90">7. Governing Law</h4>
                <p>
                    These Terms shall be governed by and construed in accordance with the laws of India.
                </p>

                <h4 className="font-semibold text-foreground/90">8. Updates</h4>
                <p>
                    kanstruction may update these Terms at any time. Continued use of the Platform means you accept the new Terms.
                </p>
                
                <div className="border-t my-6"></div>

                <h3 className="font-semibold text-foreground">kanstruction — PRIVACY POLICY</h3>

                <p className="text-xs">Effective Date: 23-07-2025</p>

                <h4 className="font-semibold text-foreground/90">1. Information We Collect</h4>
                <div>
                    <p>We collect:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Basic account info (name, phone number, email)</li>
                        <li>Requirements or quotations you post</li>
                        <li>Transaction data (for record-keeping only)</li>
                    </ul>
                </div>

                <h4 className="font-semibold text-foreground/90">2. How We Use Your Data</h4>
                    <p>To operate the Platform.</p>
                    <p>To connect you with other users.</p>
                    <p>To communicate with you regarding your activity on the Platform.</p>

                <h4 className="font-semibold text-foreground/90">3. Data Sharing</h4>
                <p>We do not sell your personal information. We only share your data with other users as needed for quotations and transactions.</p>
                
                <h4 className="font-semibold text-foreground/90">4. Data Security</h4>
                <p>We use Firebase security standards to protect your information.</p>
                
                <h4 className="font-semibold text-foreground/90">5. Your Rights</h4>
                <p>You may request deletion of your account and data by contacting our support.</p>
                
                <h4 className="font-semibold text-foreground/90">6. Changes</h4>
                <p>We may update this Privacy Policy. Continued use of the Platform means you accept the changes.</p>
                
                <div className="border-t my-6"></div>

                <h3 className="font-semibold text-foreground">Legal Disclaimer</h3>
                <p>
                    <strong>Disclaimer:</strong> kanstruction is only a digital marketplace connecting buyers and sellers. kanstruction does not own, deliver, or sell any materials directly and is not responsible for payment disputes, delivery delays, or product issues.
                </p>

                <h4 className="font-semibold text-foreground/90">Contact Us:</h4>
                <p>
                    For any questions or to request account deletion, email: <a href="mailto:kanstruction.kart@gmail.com" className="underline">kanstruction.kart@gmail.com</a>
                </p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
