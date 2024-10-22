"use client";

import { Metadata } from "next";
import Link from "next/link";
import { Icons } from "@/components/icons";
import apiService from "@/service/api.service";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from 'next-intl'; // Import useTranslations
import { usePathname, useRouter } from 'next/navigation';
import LanguageChanger from "@/components/layout/language-switcher";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
};

export interface EntityData {
  previewLogo?: string;
  previewTitle?: string;
}

async function getData(clientId: string, accessId: string): Promise<{ entity?: EntityData } | null> {
  try {
    const res = await apiService.get(`/access/preview/minimal`, {}, {
      clientId: clientId,
      accessId: accessId
    });
    return res;
  } catch (e) {
    console.error(e);
    return null;
  }
}

function handleBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else if (window.opener) {
    window.close();
  } else {
    // Fallback logic if not a popup and no history
    //window.location.href = '/';
  }
}

interface AuthLayoutProps {
  children: React.ReactNode;
  entityData?: EntityData | null | undefined;
}

export default function AuthLayout({ children, entityData }: AuthLayoutProps) {
  const t = useTranslations('connect'); // Use the useTranslations hook
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="md:grid md:grid-cols-2 md:px-0 h-screen overflow-y-auto">
      <div className="flex flex-col w-full h-30 items-center justify-center bg-zinc-900 text-white p-4 md:w-auto md:min-h-screen md:h-full md:relative md:dark:border-r md:p-10 md:items-start md:justify-start">
        <div className="relative z-20 flex items-center text-lg font-medium">
          {entityData ? (
            <>
              <Image
                src={entityData.previewLogo || '/placeholder-black.svg'}
                width={32}
                height={32}
                alt="Preview Logo"
                className="mr-4"
              />
              {entityData.previewTitle}
            </>
          ) : (
            <Skeleton className="w-32 h-8" />
          )}
        </div>

        <div className="relative z-20 mt-4 md:mt-12 text-center md:text-left">
          <blockquote className="space-y-2">
            <div className="md:text-3xl font-medium max-w-full md:max-w-[40vw]">
              {entityData ? (
                `${entityData.previewTitle} ${t('partnersWith')} Eartho ${t('forSecureAccess')}.`
              ) : (
                <Skeleton className="w-80 h-8" />
              )}
            </div>
            <Link href="#">
              <footer className="mt-2 text-sm flex justify-center md:justify-start" onClick={handleBack}>
                <Icons.back className="mr-2 mt-[1px] h-4 w-4" />
                {entityData ? (
                  `${t('returnTo')} ${entityData.previewTitle}`
                ) : (
                  <Skeleton className="w-32 h-4" />
                )}
              </footer>
            </Link>
          </blockquote>
        </div>

        <div className="hidden md:block relative z-20 mt-auto p-4 md:p-0">
          <div className="text-sm mt-3"><Link href="https://eartho.io/contact">{t('contact')}</Link></div>
          <div className="text-sm mt-3"><Link href="https://www.eartho.io/legal/terms-of-service">{t('terms')}</Link></div>
          <div className="text-sm mt-3"><Link href="https://www.eartho.io/legal/privacy-policy">{t('privacy')}</Link></div>
          <div className="mt-4 relative z-20 flex items-center text-md font-regular">
            <div className="text-sm">{t('poweredBy')}</div>
            <div className="font-medium text-lg ml-1"><Link href="https://eartho.io">Eartho.</Link></div>
          </div>
          <div className="mt-4">
            <LanguageChanger />
          </div>
        </div>
      </div>
      <div className="w-full p-4 md:p-0 md:ml-auto md:flex md:items-center md:justify-center md:h-screen overflow-y-auto">
        {children}
      </div>

      <div className="block md:hidden relative z-20 mt-auto p-4 md:p-0 ml-4 space-y-4">
        <div className="">
          <div className="text-sm mt-3"><Link href="https://eartho.io/contact">{t('contact')}</Link></div>
          <div className="text-sm mt-3"><Link href="https://www.eartho.io/legal/terms-of-service">{t('terms')}</Link></div>
          <div className="text-sm mt-3"><Link href="https://www.eartho.io/legal/privacy-policy">{t('privacy')}</Link></div>
        </div>
        <div className="mt-4 relative z-20 flex items-center text-md font-regular">
          <div className="text-sm">{t('poweredBy')}</div>
          <div className="font-medium text-lg ml-1"><Link href="https://eartho.io">Eartho.</Link></div>
        </div>
        <div className="mt-4">
          <LanguageChanger />
        </div>
      </div>

    </div>
  );
}

export async function fetchEntityData(clientId: string, accessId: string): Promise<EntityData | null> {
  const entityData = await getData(clientId, accessId);
  return entityData?.entity || null;
}
