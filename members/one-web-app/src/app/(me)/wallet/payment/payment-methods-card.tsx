import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import AddMethodDialog from "./add-method-dialog";
import PaymentPreview from "@/components/layout/payment-methods";
import { Separator } from "@/components/ui/separator";

interface PaymentMethodsCardProps {
  wallet: any; // Replace 'any' with the actual type of 'wallet' if known
  elementToken: string;
}

const PaymentMethodsCard: React.FC<PaymentMethodsCardProps> = ({ wallet, elementToken }) => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Card className="col-span-4 md:col-span-3">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Payment Methods</CardTitle>
            <CardDescription>Payment methods are saved in your <br />Eartho Account so you can use them across the internet.</CardDescription>
          </div>

        </div>
      </CardHeader>

      <CardContent className="p-0">
        <PaymentPreview wallet={wallet} />
        <Separator />
        <div className="p-4">
        <Button variant="link" className="text-xs md:text-sm text-blue-600" onClick={() => setOpen(true)}>
          {/* <PlusCircledIcon className="mr-2 h-4 w-4" /> */}
          Add New Payment Method
        </Button>
        </div>
      </CardContent>
      <AddMethodDialog open={open} setOpen={setOpen} elementToken={elementToken} />
    </Card>
  );
};

export default PaymentMethodsCard;
