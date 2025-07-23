
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

export function TermsDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button type="button" className="inline underline hover:text-primary p-0 h-auto">Terms &amp; Conditions and Privacy Policy</button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                 <DialogHeader>
                    <DialogTitle>Terms, Conditions & Privacy Policy</DialogTitle>
                    <DialogDescription>
                        Effective Date: 23-07-2025
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-96 pr-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground space-y-4">
                        <h3 className="font-semibold text-foreground">TRADEFLOW — TERMS & CONDITIONS</h3>
                        
                        <h4 className="font-semibold text-foreground/90">1. Introduction</h4>
                        <p>
                            Welcome to TradeFlow (“we”, “our”, “us”). By accessing or using the TradeFlow app or website (“tradeflow”), you agree to these Terms & Conditions (“Terms”). If you do not agree, do not use the Platform.
                        </p>
                        
                        <h4 className="font-semibold text-foreground/90">2. Nature of the Platform</h4>
                        <p>
                            TradeFlow is a neutral online marketplace that connects homeowners, contractors, and shop owners for the purpose of buying and selling construction materials such as cement, steel, bricks, electrical items, and more.
                        </p>
                         <p>
                            TradeFlow does not own, stock, transport, or sell any goods. It is solely a digital facilitator.
                        </p>

                        <h4 className="font-semibold text-foreground/90">3. User Responsibilities</h4>
                        <p>You are solely responsible for the accuracy of information you provide.</p>
                        <p>You are responsible for verifying the quality, quantity, and condition of materials before paying or accepting delivery.</p>
                        <p>You must comply with all applicable local, state, and national laws.</p>
                        
                        <h4 className="font-semibold text-foreground/90">4. Payments & Delivery</h4>
                        <p>All pricing, payment terms, delivery, and returns are solely agreed upon between the buyer and the seller.</p>
                        <p>TradeFlow does not handle payment collection, refunds, or delivery.</p>
                        <p>Any disputes must be resolved directly between the parties involved.</p>

                        <h4 className="font-semibold text-foreground/90">5. Limitation of Liability</h4>
                        <p>
                            TradeFlow, its owners, employees, or partners will not be liable for any loss, damage, dispute, or claim arising out of:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Transactions conducted through the Platform.</li>
                            <li>Delays, non-delivery, or defective goods.</li>
                            <li>Any misuse of the Platform by buyers or sellers.</li>
                        </ul>
                        <p>
                            You agree to indemnify and hold harmless TradeFlow from any claims arising out of your use of the Platform.
                        </p>
                        
                        <h4 className="font-semibold text-foreground/90">6. Termination</h4>
                        <p>
                            TradeFlow may suspend or terminate your access at any time for violation of these Terms or misuse of the Platform.
                        </p>

                        <h4 className="font-semibold text-foreground/90">7. Governing Law</h4>
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of India.
                        </p>

                        <h4 className="font-semibold text-foreground/90">8. Updates</h4>
                        <p>
                           TradeFlow may update these Terms at any time. Continued use of the Platform means you accept the new Terms.
                        </p>
                        
                        <div className="border-t my-6"></div>

                        <h3 className="font-semibold text-foreground">TRADEFLOW — PRIVACY POLICY</h3>

                        <h4 className="font-semibold text-foreground/90">1. Information We Collect</h4>
                        <p>We collect:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                           <li>Basic account info (name, phone number, email)</li>
                           <li>Requirements or quotations you post</li>
                           <li>Transaction data (for record-keeping only)</li>
                        </ul>

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
                            <strong>Disclaimer:</strong> TradeFlow is only a digital marketplace connecting buyers and sellers. TradeFlow does not own, deliver, or sell any materials directly and is not responsible for payment disputes, delivery delays, or product issues.
                        </p>

                        <h4 className="font-semibold text-foreground/90">Contact Us:</h4>
                        <p>
                           For any questions or to request account deletion, email: <a href="mailto:tradeflow.kart@gmail.com" className="underline">tradeflow.kart@gmail.com</a>
                        </p>

                    </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogTrigger asChild>
                        <Button type="button">Close</Button>
                    </DialogTrigger>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
