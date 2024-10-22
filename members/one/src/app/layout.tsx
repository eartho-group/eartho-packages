import Providers from "@/components/layout/providers";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eartho | Become undetectable online",
  description: "",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className} overflow-hidden`}>
        <Providers>
          <NextIntlClientProvider messages={messages}>
            <Toaster />
            {children}
          </NextIntlClientProvider>
          </Providers>
    </body>
    </html >
  );
}
