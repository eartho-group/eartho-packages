"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from 'next/image';

export default function UserApprovalForm({redirectUri = '/'}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const enabledProviders = searchParams.get('enabled_providers');

 
 
  

  return (
    <div className="flex flex-col mt-3 text-left  antialiased">
      <div className="flex-col grid grid-cols-3 px-2 overflow-y-auto overflow-x-hidden">
        
      </div>
    </div>
  );
}
