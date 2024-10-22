import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AddMethodComponent from "./add-method-component";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// const stripePromise = loadStripe('pk_test_51L4jbTHiHvTN8ehOKwRt1CSIgp8agJVJnFSleHiWE1CbQONjzAnsZwDSBwHkWM1CxcmxHhasndbGfuWpcFEwlW4200YHjUyThv');
const stripePromise = loadStripe('pk_live_51L4jbTHiHvTN8ehOCQt8xCzjkLNefpafTMp3r7ZnlgkWq75tUymMuDqCTeajfzi45ckFt6ScQvGlAVIgYuxfEcGZ00GbG0vck1');

interface AddMethodDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  elementToken: string;
}

const AddMethodDialog: React.FC<AddMethodDialogProps> = ({ open, setOpen, elementToken }) => {
  const options = {
    clientSecret: elementToken,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Payment Method</DialogTitle>
          <DialogDescription>Add a new payment method using Stripe.</DialogDescription>
        </DialogHeader>
        {elementToken && (
          <Elements stripe={stripePromise} options={options}>
            <AddMethodComponent />
          </Elements>
        )}
        <DialogFooter>
          {/* <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="outline" form="add-method-form">
            Submit
          </Button> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMethodDialog;
