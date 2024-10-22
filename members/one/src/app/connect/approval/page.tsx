'use client';

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";
import ApprovalComponent from "./approval";
import AuthLayout, { EntityData, fetchEntityData } from "../side-component";
import { signOut } from "next-auth/react";
import LanguageChanger from "@/components/layout/language-switcher";
import { useTranslations } from 'next-intl';


export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entityData, setEntityData] = useState<EntityData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const t = useTranslations('auth');

  useEffect(() => {

    const clientId = searchParams.get('client_id') || '';
    const scope = searchParams.get('scope') || '';
    const audience = searchParams.get('audience') || '';
    const accessId = searchParams.get('access_id') || '';
    const responseType = searchParams.get('response_type') || '';
    const responseMode = searchParams.get('response_mode') || '';
    const state = searchParams.get('state') || '';
    const nonce = searchParams.get('nonce') || '';
    const redirectUri = searchParams.get('redirect_uri') || '';
    const codeChallenge = searchParams.get('code_challenge') || '';
    const codeChallengeMethod = searchParams.get('code_challenge_method') || '';
    const earthoOneClient = searchParams.get('earthoOneClient') || '';

    if (!redirectUri) {
      router.push('/');
      return;
    }

    if (!clientId) {
      setErrorMessage('Client ID is missing.');
      return;
    }

    if (!accessId) {
      setErrorMessage('Access ID is missing.');
      return;
    }

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
  }, [searchParams, router]);

  const queryParams = new URLSearchParams(Object.fromEntries(searchParams.entries())).toString();
  const lastPage = `/connect/signin?${queryParams}`;

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
      <div className="p-4 lg:p-8 h-full flex items-center">
        <div className="mx-auto flex flex-col space-y-6 w-full max-w-[350px]">
          <ApprovalComponent />
          <p
            className="px-8 text-center text-sm text-muted-foreground underline cursor-pointer"
            onClick={() =>
              signOut({ redirect: false }).then(x => {
                router.replace(lastPage)
              })
            }
          >
            {t('signOut')}
          </p>
          {/* <div className="mt-4 md:hidden">
           <LanguageChanger />
          </div> */}
        </div>
      </div>
    </AuthLayout>
  );
}
