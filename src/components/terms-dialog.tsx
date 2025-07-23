
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
                <button type="button" className="inline underline hover:text-primary p-0 h-auto">Terms & Conditions</button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                 <DialogHeader>
                    <DialogTitle>TRADEFLOW — TERMS & CONDITIONS</DialogTitle>
                    <DialogDescription>
                        Effective Date: 23-07-2025
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-96 pr-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground space-y-4">
                        <h3 className="font-semibold text-foreground">1. Introduction</h3>
                        <p>
                            Welcome to TradeFlow (“we”, “our”, “us”). By accessing or using the TradeFlow app or website (“tradeflow”), you agree to these Terms & Conditions (“Terms”). If you do not agree, do not use the Platform.
                        </p>
                        
                        <h3 className="font-semibold text-foreground">2. Nature of the Platform</h3>
                        <p>
                            TradeFlow is a neutral online marketplace that connects homeowners, contractors, and shop owners for the purpose of buying and selling construction materials such as cement, steel, bricks, electrical items, and more.
                        </p>
                         <p>
                            TradeFlow does not own, stock, transport, or sell any goods. It is solely a digital facilitator.
                        </p>

                        <h3 className="font-semibold text-foreground">3. User Responsibilities</h3>
                        <p>You are solely responsible for the accuracy of information you provide.</p>
                        <p>You are responsible for verifying the quality, quantity, and condition of materials before paying or accepting delivery.</p>
                        <p>You must comply with all applicable local, state, and national laws.</p>
                        
                        <h3 className="font-semibold text-foreground">4. Payments & Delivery</h3>
                        <p>All pricing, payment terms, delivery, and returns are solely agreed upon between the buyer and the seller.</p>
                        <p>TradeFlow does not handle payment collection, refunds, or delivery.</p>
                        <p>Any disputes must be resolved directly between the parties involved.</p>

                        <h3 className="font-semibold text-foreground">5. Limitation of Liability</h3>
                        <p>
                            TradeFlow, its owners, employees, or partners will not be liable for any loss, damage, dispute, or claim arising out of:
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Transactions conducted through the Platform.</li>
                                <li>Delays, non-delivery, or defective goods.</li>
                                <li>Any misuse of the Platform by buyers or sellers.</li>
                            </ul>
                        </p>
                        <p>
                            You agree to indemnify and hold harmless TradeFlow from any claims arising out of your use of the Platform.
                        </p>
                        
                        <h3 className="font-semibold text-foreground">6. Termination</h3>
                        <p>
                            TradeFlow may suspend or terminate your access at any time for violation of these Terms or misuse of the Platform.
                        </p>

                        <h3 className="font-semibold text-foreground">7. Governing Law</h3>
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of India.
                        </p>

                        <h3 className="font-semibold text-foreground">8. Updates</h3>
                        <p>
                           TradeFlow may update these Terms at any time. Continued use of the Platform means you accept the new Terms.
                        </p>

                         <h3 className="font-semibold text-foreground">Contact Us:</h3>
                        <p>
                           If you have any questions about these Terms, email: <a href="mailto:tradeflow.kart@gmail.com" className="underline">tradeflow.kart@gmail.com</a>
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
