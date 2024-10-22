import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BillingDetailsForm } from "@/components/layout/payment-billing-details";

const BillingDetailsCard = () => {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="text-lg">Payments profile</CardTitle>
        <CardDescription>The profile you select will be used for Eartho Pay transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <BillingDetailsForm />
      </CardContent>
    </Card>
  );
};

export default BillingDetailsCard;
