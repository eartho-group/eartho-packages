"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signIn, getSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

interface Provider {
  icon: string;
  name: string;
}

const providers: Record<string, Provider> = {
  google: { icon: "/icons/auth/google.svg", name: "Google" },
  apple: { icon: "/icons/auth/apple.svg", name: "Apple" },
  facebook: { icon: "/icons/auth/facebook.svg", name: "Facebook" },
  twitter: { icon: "/icons/auth/twitter.svg", name: "Twitter" },
  github: { icon: "/icons/auth/github.svg", name: "GitHub" },
  sms: { icon: "/icons/auth/sms.svg", name: "SMS" },
  email: { icon: "/icons/auth/emailotp.svg", name: "Email" },
  vk: { icon: "/icons/auth/vk.svg", name: "VK" },
  reddit: { icon: "/icons/auth/reddit.svg", name: "Reddit" },
  yandex: { icon: "/icons/auth/yandex.svg", name: "Yandex" },
  metamask: { icon: "/icons/auth/metamask.svg", name: "MetaMask" },
  walletconnect: { icon: "/icons/auth/walletconnect.svg", name: "WalletConnect" },
};

interface Account {
  provider: string;
}

const ConnectedAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const session = await getSession();
        if (session?.user?.accounts) {
          setAccounts(Object.values(session.user.accounts));
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const linkAccount = async (provider: string) => {
    await signIn(provider, { redirect: false });
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Connected Accounts</CardTitle>
        <CardDescription>Manage your connected accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Connect all your accounts with Eartho to seamlessly switch between them.</p>
        {loading && <Skeleton className="mt-4 h-6 w-[250px]" />}
        {error && <p className="mt-4 text-red-600">{error}</p>}
        {!loading && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {accounts.map((account) => (
                <div key={account.provider} className="flex items-center space-x-2">
                  <Image
                    src={providers[account.provider]?.icon || "/icons/auth/default.svg"}
                    width={28}
                    height={28}
                    alt={`${providers[account.provider]?.name || "Unknown"} icon`}
                  />
                  <span className="text-sm">{providers[account.provider]?.name || "Unknown"}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>

      {/* Bottom Button Section */}
      <div className="border-t border-gray-200 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="link" className="text-blue-600">
              Attach New Account
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {Object.entries(providers).map(([provider, { icon, name }]) => (
              !accounts.some((account) => account.provider === provider) && (
                <DropdownMenuItem key={provider} onSelect={() => linkAccount(provider)}>
                  <div className="flex items-center space-x-2">
                    <Image src={icon} width={20} height={20} alt={`${name} icon`} />
                    <span>{name}</span>
                  </div>
                </DropdownMenuItem>
              )
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};

export default ConnectedAccounts;
