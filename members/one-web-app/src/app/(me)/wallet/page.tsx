"use client";
import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import PaymentMethodsCard from "./payment/payment-methods-card";
import BillingDetailsCard from "./billing/billing-details-card";
import { FinanceService } from "service";

export default function Page() {
  const [elementToken, setElementToken] = useState<string>('');
  const [wallet, setWallet] = useState<any | null>(null);

  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.accessToken) return;
    const financeService = FinanceService();
    financeService.getPaymentToken().then((t) => setElementToken(t));
    financeService.getPaymentMethods().then((t) => setWallet(t));
  }, [session?.accessToken]);

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold mb-2">Wallet</h1>
          <p className="text-gray-500">
            Your payment info, transactions, recurring payments, and reservations
          </p>
        </div>
        <PaymentMethodsCard wallet={wallet} elementToken={elementToken} />
        <BillingDetailsCard />
      </div>
    </ScrollArea>
  );
}
