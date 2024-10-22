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
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const formSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  otp: z.string().optional()
});

type UserFormValue = z.infer<typeof formSchema>;

export default function UserEmailAuthForm({ successUrl }: { successUrl: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations(); // Use the useTranslations hook
  const callbackUrl = searchParams.get('callbackUrl');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [tab, setTab] = useState('otp');
  const [attempts, setAttempts] = useState(0);
  const [otpError, setOtpError] = useState('');
  const defaultValues = {
    email: '',
    otp: ''
  };
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: UserFormValue) => {
    setLoading(true);
    try {
      if (tab === 'otp') {
        if (!otpSent) {
          setOtpSent(true);
          setOtpError('');
          // Uncomment and adjust the following line as per your backend logic
          await startEmailAuth(data.email);
          setLoading(false);
        } else {
          await signIn('email-otp', { email: data.email, otp: data.otp, redirect: false });
          await router.replace(successUrl);
          setLoading(false);
        }
      } else {
        // await signIn('email-magic', {
        //   email: data.email,
        //   redirect: false,
        // });
        // Uncomment and adjust the following line as per your backend logic
        // router.push('email/success');
      }
    } catch (error) {
      console.error("An error occurred:", error);
      setLoading(false);
    }
  };

  async function startEmailAuth(email: string) {
    try {
      const response = await fetch('/api/auth/signin/email/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email }),
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
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="text-center">
          <TabsList>
            <TabsTrigger value="otp">{t('auth.oneTimePass')}</TabsTrigger>
            <TabsTrigger value="magicLink" disabled>{t('auth.magicLink')}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="otp">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('auth.enterEmail')}
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
                          placeholder={t('auth.enterCodeEmail')}
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      {otpError && <p className="text-red-500 text-sm font-medium">{otpError}</p>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <Button disabled={loading} className="ml-auto w-full" type="submit">
                {otpSent ? t('auth.continueWithEmail') : t('auth.sendCode')}
              </Button>
            </form>
          </Form>
        </TabsContent>
        <TabsContent value="magicLink">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('auth.enterEmail')}
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button disabled={loading} className="ml-auto w-full" type="submit">
                {t('auth.sendMagicLink')}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </>
  );
}
