import { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import apiService from "@/service/api.service";
import Image from "next/image";
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
};

async function getData(clientId: string, accessId: string) {
  try {
    const res = await apiService.get(`/access/preview/minimal?clientId=${clientId}&accessId=${accessId}`, { cache: 'no-store' });
    return res;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();

  return (
    <div className="relative h-screen flex flex-col items-center justify-center md:grid md:max-w-none md:grid-cols-2 md:px-0">
      <Link
        href="/examples/authentication"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-4 hidden top-4 md:right-8 md:top-8",
        )}
      >
        {t('auth.signIn')}
      </Link>
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          Eartho.
        </div>
        {/* <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;{t('auth.testimonial')}&rdquo;
            </p>
            <footer className="text-sm">{t('auth.testimonialAuthor')}</footer>
          </blockquote>
        </div> */}
      </div>
      <div className="flex-1 w-full h-full p-4 md:p-0 md:ml-auto md:flex md:items-center md:justify-center">
        {children}
      </div>
    </div>
  );
}
