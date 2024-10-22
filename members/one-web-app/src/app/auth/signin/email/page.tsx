'use client';

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthLayout from "../../side-component";
import UserEmailAuthForm from "@/components/forms/user-email-auth-form";
import { useTranslations } from 'next-intl';

export default function Page() {
  const searchParams = useSearchParams();
  const t = useTranslations(); // Use the useTranslations hook

  return (
    <AuthLayout>
      <div className="p-4 lg:p-8 h-full flex items-center">
        <div className="mx-auto flex flex-col space-y-6 w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{t('auth.signIn')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('auth.enterEmailToReceive')}<br />{t('auth.oneTimePassQuickLoginEmail')}
            </p>
          </div>
          <UserEmailAuthForm successUrl={'/'} />
          <div>
            <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
              {t('auth.agreeToTerms')}{" "}
              <Link
                href="https://www.eartho.io/legal/terms-of-service"
                className="underline underline-offset-4 hover:text-primary"
              >
                <br />{t('auth.termsOfService')}
              </Link>{" "}
              {t('auth.and')}{" "}
              <Link
                href="https://www.eartho.io/legal/privacy-policy"
                className="underline underline-offset-4 hover:text-primary"
              >
                {t('auth.privacyPolicy')}
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
