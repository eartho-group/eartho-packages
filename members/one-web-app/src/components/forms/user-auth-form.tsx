'use client';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { handleMetaMaskLogin } from "@/lib/auth/crypto/service";
import { Web3Modal } from "@/lib/auth/crypto/web3modal";
import { useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider } from "@web3modal/ethers/react";
import { BrowserProvider, ethers } from "ethers";
import { Loader2 } from "lucide-react";
import { Icons } from "@/components/icons";
import { handleAuthError } from "@/lib/auth/util";

interface UserAuthFormProps {
  redirectUri?: string;
}

export default function UserAuthForm({ redirectUri = '/' }: UserAuthFormProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State to store error message
  const { open } = useWeb3Modal();
  const { walletProvider } = useWeb3ModalProvider();
  const { address, isConnected } = useWeb3ModalAccount();
  const { data: session } = useSession();

  const router = useRouter();
  const searchParams = useSearchParams();
  const enabledProviders = searchParams.get('enabled_providers');

  const errorQueryParam = searchParams.get('error');

  useEffect(() => {
    if (!session?.accessToken) return;
    router.replace(redirectUri);
  }, [session?.accessToken]);

  useEffect(() => {
    if (window && window.sessionStorage) {
      const errorStorageParam = sessionStorage?.getItem('authError');
      if (errorStorageParam && !errorQueryParam) {
        sessionStorage.removeItem('authError');
        setErrorMessage(errorStorageParam); // Set error message if error query param exists
        console.log("error "+errorStorageParam);
      }
    }
  }, []);

  useEffect(() => {
    if (errorQueryParam) {
      handleAuthError(errorQueryParam)
    }
  }, [errorQueryParam]);

  const withLoader = (providerName: string, action: () => Promise<void>) => async () => {
    setLoadingProvider(providerName);
    try {
      await action();
    } catch (e) {
      setLoadingProvider(null);
      setErrorMessage(`Error with ${providerName} login`); // Set error message on error
    }
  };

  const providers = {
    google: {
      icon: Icons.google,
      action: withLoader('google', () => nextAuthSignIn('google')),
    },
    apple: {
      icon: Icons.apple,
      action: withLoader('apple', () => nextAuthSignIn('apple')),
    },
    facebook: {
      icon: Icons.facebook,
      action: withLoader('facebook', () => nextAuthSignIn('facebook')),
    },
    twitter: {
      icon: Icons.twitter,
      action: withLoader('twitter', () => nextAuthSignIn('twitter')),
    },
    emailotp: {
      icon: Icons.emailotp,
      action: withLoader('emailotp', async () => startAuth("email")),
    },
    github: {
      icon: Icons.github,
      action: withLoader('github', () => nextAuthSignIn('github')),
    },
    sms: {
      icon: Icons.sms,
      action: withLoader('sms', async () => startAuth("phone")),
    },
    vk: {
      icon: Icons.vk,
      action: withLoader('vk', () => nextAuthSignIn('vk')),
    },
    reddit: {
      icon: Icons.reddit,
      action: withLoader('reddit', () => nextAuthSignIn('reddit')),
    },
    yandex: {
      icon: Icons.yandex,
      action: withLoader('yandex', () => nextAuthSignIn('yandex')),
    },
    metamask: {
      icon: Icons.metamask,
      action: withLoader('metamask', async () => {
        await handleMetaMaskLogin(() => {
          router.replace(redirectUri);
        });
      }),
    },
    walletconnect: {
      icon: Icons.walletconnect,
      action: withLoader('walletconnect', async () => {
        try {
          if (!isConnected) {
            await open();
          }
          if (isConnected) {
            const userAddress = address;
            const response = await fetch("/api/auth/signin/crypto/nonce", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ publicAddress: userAddress }),
            });

            const { nonce } = await response.json();

            if (!walletProvider) return;
            const ethersProvider = new BrowserProvider(walletProvider);
            const signer = await ethersProvider.getSigner();
            const signedNonce = await signer.signMessage(nonce);

            await signIn("cryptowallet", {
              redirect: false,
              publicAddress: userAddress,
              signedNonce,
            });

            router.replace(redirectUri);
          }
        } catch (error) {
          console.error('Error connecting with WalletConnect:', error);
          setErrorMessage('Error connecting with WalletConnect'); // Set error message on error
        }
      }),
    },
  };

  const startAuth = (path: string) => {
    router.push(`${window.location.pathname}/${path}${window.location.search}`);
  };

  const shouldPresent = (providerName: string) => {
    return !enabledProviders || enabledProviders.includes(providerName);
  };

  async function nextAuthSignIn(provider: string) {
    if (session?.accessToken) return;

    const currentUrl = window.location.href;
    sessionStorage.setItem('authReferrer', currentUrl);
    try {
      const result = await signIn(provider, {
        redirect: true,
        callbackUrl: redirectUri,
      });
    } catch (error) {
      console.log(error);
      setErrorMessage(`Error signing in with ${provider}`); // Set error message on error
    }
  }

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "CredentialsSignin":
        return "Invalid credentials, please try again.";
      case "OAuthAccountNotLinked":
        return "There is already account on this email from another provider, sign in with the same account you used originally, and then link the accounts";
      case "EmailSignin":
        return "There was an issue sending the email.";
      case "Configuration":
        return "This provider does not allowed in your country.";
      default:
        return "";
    }
  };

  return (
    <Web3Modal>
      <div className="flex flex-col mt-3 text-left antialiased">
        <div className="flex-col grid grid-cols-3 px-2 overflow-y-auto overflow-x-hidden">
          {Object.entries(providers).map(([provider, { icon: Icon, action }]) => (
            shouldPresent(provider) && (
              <div
                key={provider}
                className="mr-1 mt-1 max-w-[128px] max-h-[128px] min-h-[78px] border border-solid dark:border-[#2c2c2c] border-[#f2f4f7] rounded-[14.4px] flex justify-center items-center cursor-pointer transition-transform duration-400 ease hover:bg-[#fafafa] dark:hover:bg-[#1f1f1f] relative"
                onClick={action}
              >
                {loadingProvider === provider && (
                  <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-[#333] bg-opacity-75 rounded-[14.4px]">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  </div>
                )}
                {loadingProvider !== provider && (
                  <div className="w-[32px] h-[32px]">
                    {Icon && <Icon className="h-6 w-6 dark:fill-white" />}
                  </div>
                )}
              </div>
            )
          ))}
        </div>
        {errorMessage && (
          <div className="flex justify-center items-center mt-4 text-red-500 text-sm font-medium text-center content-center">
            {(getErrorMessage(errorMessage))}
          </div>
        )}
      </div>
    </Web3Modal>
  );
}
