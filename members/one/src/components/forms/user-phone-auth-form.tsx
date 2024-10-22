'use client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useTranslations } from 'next-intl';

// Regex pattern to check for a valid phone number with country code
const phoneRegex = /^\+\d{1,3}\d{7,14}$/;

const formSchema = z.object({
  phone: z.string().regex(phoneRegex, { message: 'Enter a valid phone number with country code' }),
  otp: z.string().optional()
});

type UserFormValue = z.infer<typeof formSchema>;

export default function UserPhoneAuthForm({ successUrl }: { successUrl: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations(); // Use the useTranslations hook
  const callbackUrl = searchParams.get('callbackUrl');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [otpError, setOtpError] = useState('');

  const defaultValues = {
    phone: '',
    otp: ''
  };
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: UserFormValue) => {
    setLoading(true);
    try {
      if (!otpSent) {
        setOtpSent(true);
        setOtpError('');
        startPhoneAuth(data.phone)
        setLoading(false);
      } else {
        await signIn("phone-otp", { phone: data.phone, otp: data.otp, redirect:false });
        router.replace(successUrl)
      }
    } catch (error) {
      console.error("An error occurred:", error);
    } finally {
    }
  };

  async function startPhoneAuth(phone: string) {
    try {
      const response = await fetch('/api/auth/signin/phone/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phone }),
      });
      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }
      setOtpSent(true);
    } catch (error) {
      handleError(error);
    }
  }

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      setOtpError(err.message);
    } else {
      setOtpError('An unknown error occurred');
    }
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-4"
        >
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.phoneNumber')}</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder={t('auth.enterPhone')}
                    disabled={loading || otpSent}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {otpSent && (
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.code')}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder={t('auth.enterCodePhone')}
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button disabled={loading} className="ml-auto w-full" type="submit">
            {otpSent ? t('auth.login') : t('auth.sendCode')}
          </Button>
        </form>
      </Form>
    </>
  );
}
