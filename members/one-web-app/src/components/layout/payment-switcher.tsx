"use client";

import * as React from "react";
import { CaretSortIcon, CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DialogTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreditCard } from "@/components/creditcard"; // Ensure this path is correct
import { OtherPaymentMethod } from "@/components/creditcard"; // Ensure this path is correct
import { useTranslations } from 'next-intl';
import AddMethodDialog from "@/app/(me)/wallet/payment/add-method-dialog";

type PaymentMethodType = {
  type: "credit-card" | "other";
  id?: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  name?: string;
  icon?: string;
  value: string;
};

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>;

interface PaymentSwitcherProps extends PopoverTriggerProps {
  wallet: {
    default: PaymentMethodType;
    all: PaymentMethodType[];
  };
  onPaymentMethodChange?: (method: PaymentMethodType) => void; // Optional callback prop
  elementToken: string;
}

export default function PaymentSwitcher({ wallet, className, onPaymentMethodChange, elementToken }: PaymentSwitcherProps) {
  const t = useTranslations('components.paymentSwitcher');
  const [open, setOpen] = React.useState(false);
  const [showNewCardDialog, setShowNewCardDialog] = React.useState(false);
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethodType | null>(null);

  const initialGroups = React.useMemo(() => [
    { label: t('cards'), methods: [] as PaymentMethodType[] },
    { label: t('otherProviders'), methods: [] as PaymentMethodType[] },
  ], [t]);

  const [groups, setGroups] = React.useState(initialGroups);

  React.useEffect(() => {
    const cardMethods = wallet.all.filter((method) => method.type === "credit-card");
    const otherMethods = wallet.all.filter((method) => method.type === "other");

    const updatedGroups = [...initialGroups];
    updatedGroups[0].methods = cardMethods;
    updatedGroups[1].methods = otherMethods;

    setGroups(updatedGroups);
    setSelectedMethod(updatedGroups[0].methods[0] || updatedGroups[1].methods[0] || null);
  }, [wallet, initialGroups]);

  const renderPaymentMethod = (method: PaymentMethodType) => {
    if (method.type === "credit-card") {
      return (
        <CreditCard
          cardBrand={method.brand ?? ""}
          cardLast4={method.last4 ?? ""}
          cardExpMonth={method.expMonth?.toString() ?? ""}
          cardExpYear={method.expYear?.toString() ?? ""}
          className="w-full"
        />
      );
    } else {
      return (
        <OtherPaymentMethod
          name={method.name ?? ""}
          icon={method.icon ?? ""}
          className="w-full"
        />
      );
    }
  };

  React.useEffect(() => {
    if (onPaymentMethodChange && selectedMethod) {
      onPaymentMethodChange(selectedMethod);
    }
  }, [selectedMethod, onPaymentMethodChange]);

  const isGroupsEmpty = groups.every(group => group.methods.length === 0);

  return (
    <Dialog open={showNewCardDialog} onOpenChange={setShowNewCardDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={t('selectPaymentMethod')}
            className={cn("w-full justify-between h-auto", className)}
          >
            {selectedMethod ? renderPaymentMethod(selectedMethod) : t('selectPaymentMethod')}
            <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder={t('searchPaymentMethod')} />
              {isGroupsEmpty ? (
                <div className="py-6 text-center text-sm">{t('noPaymentMethods')}</div>
              ) : (
                groups.map((group) => (
                  <CommandGroup key={group.label} heading={group.label}>
                    {group.methods.map((method) => (
                      <CommandItem
                        key={method.value}
                        onSelect={() => {
                          setSelectedMethod(method);
                          setOpen(false);
                        }}
                        className="text-sm"
                      >
                        {renderPaymentMethod(method)}
                        <CheckIcon
                          className={cn(
                            "ml-auto h-4 w-4",
                            selectedMethod?.value === method.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))
              )}
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setShowNewCardDialog(true);
                    }}
                  >
                    <PlusCircledIcon className="mr-2 h-5 w-5" />
                    {t('addNewCard')}
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <AddMethodDialog
        open={showNewCardDialog}
        setOpen={setShowNewCardDialog}
        elementToken={elementToken}
      />
    </Dialog>
  );
}
