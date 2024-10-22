"use client";

import * as React from "react";
import { CreditCard } from "@/components/creditcard"; // Ensure this path is correct
import { Card } from "../ui/card";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FinanceService } from "@/service";
import { Trash2, X } from "lucide-react";
import { useSession } from "next-auth/react";

type PaymentMethodType = {
    type: "credit-card";
    brand: string;
    last4: string;
    expMonth: string;
    expYear: string;
    id: string;
};

type PaymentPreviewProps = {
    wallet: {
        default: any;
        all: any[];
    };
};

export default function PaymentPreview({ wallet }: PaymentPreviewProps) {
    const [cardMethods, setCardMethods] = useState<PaymentMethodType[]>([]);
    const [selectedCard, setSelectedCard] = useState<PaymentMethodType | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!wallet?.all) return;
        const filteredMethods: PaymentMethodType[] = wallet.all.filter((method) => method.type === "card").map((method) => ({
            type: "credit-card",
            brand: method.card.brand,
            last4: method.card.last4,
            expMonth: method.card.exp_month,
            expYear: method.card.exp_year,
            id: method.id,
        }));
        setCardMethods(filteredMethods);
    }, [wallet]);

    const handleDelete = async () => {
        if (selectedCard) {
            try {
                const financeService = FinanceService();
                await financeService.deletePaymentMethod(selectedCard.id);
                setCardMethods(cardMethods.filter((method) => method.id !== selectedCard.id));
                setOpen(false);
            } catch (error) {
                console.error("Error deleting payment method:", error);
            }
        }
    };

    return (
        <div className="space-y-8">
            {cardMethods.length > 0 ? (
                cardMethods.map((method) => (
                    <Card key={method.id} className="p-2 flex justify-between items-center">
                        <CreditCard
                            cardBrand={method.brand}
                            cardLast4={method.last4}
                            cardExpMonth={method.expMonth}
                            cardExpYear={method.expYear}
                            className="w-full"
                        />
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" onClick={() => { setSelectedCard(method); setOpen(true); }}>
                                    <X className="h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Payment Method</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete this payment method?
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="destructive" onClick={handleDelete}>
                                        Delete
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </Card>
                ))
            ) : (
                <div className="flex items-center justify-center h-[128px] text-center text-sm text-muted-foreground">
                    No payment methods.
                </div>
            )}
        </div>
    );
}
