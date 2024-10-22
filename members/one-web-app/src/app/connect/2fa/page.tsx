'use client';

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";
import AuthLayout, { EntityData, fetchEntityData } from "../side-component";
import { signOut } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from 'lucide-react';

type TwoStepOption = {
  id: string;
  type: string;
  enabled: boolean;
  phoneMasked?: string;
  emailMasked?: string;
};

const fetchTwoStepStatus = async (
  setTwoStepOptions: React.Dispatch<React.SetStateAction<TwoStepOption[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  try {
    setLoading(true);
    const response = await fetch('/api/auth/2fa/verify/options');
    const data = await response.json();
    const options: TwoStepOption[] = [
      { id: data.authenticator?.id, type: 'authenticator', enabled: data.authenticator?.enabled },
      { id: data.phone?.id, type: 'phone', enabled: data.phone?.enabled, phoneMasked: data.phone?.phoneMasked },
      { id: data.email?.id, type: 'email', enabled: data.email?.enabled, emailMasked: data.email?.emailMasked }
    ].filter(option => option.enabled);
    setTwoStepOptions(options);
  } catch (err) {
    console.error('Failed to fetch two-step verification status', err);
  } finally {
    setLoading(false);
  }
};

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entityData, setEntityData] = useState<EntityData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [twoStepOptions, setTwoStepOptions] = useState<TwoStepOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<TwoStepOption | null>(null);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state for fetchTwoStepStatus
  const [isVerifying, setIsVerifying] = useState(false); // Loading state for validateCode
  const [loadingOptions, setLoadingOptions] = useState<string[]>([]); // Loading state for each option

  useEffect(() => {
    const clientId = searchParams.get('client_id') || '';
    const accessId = searchParams.get('access_id') || '';

    const fetchData = async () => {
      try {
        const data = await fetchEntityData(clientId, accessId);
        setEntityData(data);
      } catch (error) {
        console.error("Failed to fetch entity data", error);
        setErrorMessage('Failed to fetch entity data.');
      }
    };

    fetchData();
    fetchTwoStepStatus(setTwoStepOptions, setIsLoading);
  }, [searchParams, router]);

  const sendVerificationCode = async (option: TwoStepOption) => {
    try {
      setSelectedOption(option);

      setLoadingOptions(prev => [...prev, option.id]);
      await fetch('/api/auth/2fa/verify/start', {
        method: 'POST',
        body: JSON.stringify({ methodId: option.id }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setIsCodeSent(true);
    } catch (err) {
      console.error('Failed to send verification code', err);
    } finally {
      setLoadingOptions(prev => prev.filter(id => id !== option.id));
    }
  };

  const validateCode = async () => {
    try {
      setIsVerifying(true);
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ code, methodId: selectedOption?.id }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setIsCodeValid(data.success);
      if (data.success) {
        router.push('/protected');
      } else {
        // setErrorMessage('Invalid code. Please try again.');
      }
    } catch (err) {
      console.error('Failed to validate code', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const queryParams = new URLSearchParams(Object.fromEntries(searchParams.entries())).toString();
  const lastPage = `/connect/signin?${queryParams}`;

  const handleBack = () => {
    setIsCodeSent(false);
    setSelectedOption(null);
    setCode('');
  };

  if (errorMessage) {
    return (
      <AuthLayout entityData={null}>
        <div className="p-4 lg:p-8 h-full flex items-center justify-center">
          <div className="text-center text-red-500">
            {errorMessage}
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout entityData={entityData}>
      <div className="p-4 lg:p-8 h-full flex items-center justify-center">
        <div className="mx-auto flex flex-col space-y-4 w-full max-w-md">
          <h1 className="text-3xl font-medium text-center">2-Step Verification</h1>
          <p className="text-center">
            To help keep your account safe, Eartho wants to make sure that it’s really you trying to connect.
          </p>
          {isCodeSent ? (
            <>
              <div className="flex flex-col space-y-4">
                <p className="text-center">Enter the verification code from your {selectedOption?.type}:</p>
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Verification Code"
                />
                <Button onClick={validateCode} disabled={isVerifying}>
                  {isVerifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Verify'}
                </Button>
                <p onClick={handleBack} className="text-center font-medium text-sm text-white underline cursor-pointer">Select another method</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-center font-medium text-md">Choose how you want to sign in:</p>
              {isLoading ? (
                <div className="flex justify-center"><Loader2 className="mr-2 h-5 w-5 animate-spin" /></div>
              ) : (
                <>
                  {twoStepOptions.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                      No available 2-step verification options.
                    </p>
                  )}
                  {twoStepOptions.map(option => (
                    <div key={option.id} className="flex items-center justify-between border border-black p-2 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Check className="text-green-500" />
                        <div>
                          <p className="font-semibold">{option.type.charAt(0).toUpperCase() + option.type.slice(1)}</p>
                          <p className="text-sm text-muted-foreground">
                            {option.type === 'phone' && option.phoneMasked && `Verification code at ${option.phoneMasked}`}
                            {option.type === 'email' && option.emailMasked && `Verification code at ${option.emailMasked}`}
                            {option.type === 'authenticator' && `Use your authenticator app`}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => sendVerificationCode(option)} disabled={loadingOptions.includes(option.id)}>
                        {loadingOptions.includes(option.id) ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Select'}
                      </Button>
                    </div>
                  ))}
                </>
              )}
              <p onClick={handleBack} className="text-center font-medium text-sm text-white underline cursor-pointer">Add 2-Step Verification Method</p>
            </>
          )}

        </div>
      </div>
    </AuthLayout>
  );
}
