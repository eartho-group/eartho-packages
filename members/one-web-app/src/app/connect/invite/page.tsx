"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import AccessService from "@/service/access.service";
import AuthLayout, { fetchEntityData } from "../side-component";
import Link from "next/link";

interface EntityData {
  previewLogo?: string;
  previewTitle?: string;
  // Add other fields if necessary
}

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = searchParams.get('client_id') || '';
  const inviteToken = searchParams.get('invite_token') || '';

  const [entityData, setEntityData] = useState<EntityData | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: session } = useSession();

  useEffect(() => {
    if (!clientId) {
      router.push('/');
      return;
    }

    fetchEntityData(clientId, '').then(data => {
      setEntityData(data);
    });
  }, [clientId]);

  const handleConnect = async () => {
    if (!session?.accessToken || !inviteToken) return;

    try {
      const accessService = AccessService();
      await accessService.approveInvite(clientId, inviteToken);
      setStatus("success");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unknown error occurred');
      }
      setStatus("error");
    }
  };

  useEffect(() => {
    if (session?.accessToken && inviteToken) {
      handleConnect();
    }
  }, [session?.accessToken, inviteToken]);

  if (!clientId) return "Client ID is missing";

  return (
    <AuthLayout entityData={entityData}>
      <div className="p-4 lg:p-8 flex items-center">
        <div className="mx-auto flex flex-col space-y-6 w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Processing Invite</h1>
            {status === "idle" && (
              <p className="text-sm text-muted-foreground">
                Please wait while we process your invite...
              </p>
            )}
            {status === "success" && (
              <div>
              <p className="text-sm text-green-600 font-medium mb-4">
                Your invite has been successfully processed!
              </p>
              <Link href={'/'} className=" text-sm  underline">Go Back</Link>
              </div>
            )}
            {status === "error" && (
              <p className="text-sm text-red-600">
                There was an error processing your invite: {errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
