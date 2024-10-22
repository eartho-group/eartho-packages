import React, { useEffect, useState } from "react";
import { useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStripe } from "@stripe/react-stripe-js";
import { FinanceService } from "service";
import { useTranslation } from "../../../../../node_modules/react-i18next";

const AddMethodComponent: React.FC = () => {
  const { t } = useTranslation("me");
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setLoading] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const stripe = useStripe();
  const { data: session } = useSession();
  const financeService = FinanceService();

  useEffect(() => {
    if (!session?.accessToken) return;
    const clientSecret = searchParams.get("setup_intent_client_secret");
    if (stripe && clientSecret) {
      stripe.retrieveSetupIntent(clientSecret).then(({ setupIntent }) => {
        if (setupIntent && setupIntent.payment_method) {
          financeService.addPaymentMethod(setupIntent.payment_method);
          window.history.go(-2);
        }
      });
    }
  }, [stripe, session?.accessToken, searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!elements || !stripe) {
      console.log("elements or stripe is missing");
      return;
    }

    setLoading(true);

    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/wallet",
        },
      });

      if (error) {
        console.log(error);
        handleError(error);
        setLoading(false);
        return;
      }
    } catch (error: any) {
      console.log(error);
      handleError(error);
      setLoading(false);
    }

    setLoading(false);
  };

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      setErrorMessage(err.message);
    } else {
      setErrorMessage('An unknown error occurred');
    }
  };
  return (
    <div className="flex-1 flex flex-col w-[100%]">
      <div className="flex-1">
        <form id="add-method-form" onSubmit={handleSubmit}>
          <PaymentElement />
          {errorMessage && <div>{errorMessage}</div>}
        </form>
      </div>
      {isLoading ? (
        <div className="mt-4 grid place-items-center">
          {/* <LoadingIcon /> */}
        </div>
      ) : (
        <Button className="mt-4" type="submit" form="add-method-form">
          {t("Add Payment Method")}
        </Button>
      )}
    </div>
  );
};

export default AddMethodComponent;
