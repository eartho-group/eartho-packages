import { Metadata } from "next";
import Link from "next/link";
import UserAuthForm from "@/components/forms/user-auth-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AuthLayout from "../side-component";
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: "Eartho | Authentication",
  description: "",
};

export default function AuthenticationPage() {
  const t = useTranslations();

  return (
    <AuthLayout>
      <div className="p-4 lg:p-8 h-full flex items-center">
        <div className="mx-auto flex flex-col space-y-6 w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('auth.signIn')}
            </h1>
            <p className="text-sm text-muted-foreground">
            {t('auth.connectWithEartho')}
            </p>
          </div>
          <UserAuthForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            {t('auth.agreeToTerms')}{" "}
            <Link
              href="https://www.eartho.io/legal/terms-of-service"
              className="underline underline-offset-4 hover:text-primary"
            >
              {t('auth.termsOfService')}
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
    </AuthLayout>
  );
}
