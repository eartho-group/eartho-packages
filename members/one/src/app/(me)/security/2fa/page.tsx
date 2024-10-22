"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, MessageSquare, Mail, Loader2, LucideIcon } from "lucide-react";
import PhoneAuthDialog from './phone-dialog';
import EmailAuthDialog from './email-dialog';
import AuthenticatorDialog from './authenticator-dialog';

interface TwoStepStatus {
  authenticator: { enabled: boolean };
  phone: { enabled: boolean; phoneMasked: string };
  email: { enabled: boolean; emailMasked: string };
}

const fetchTwoStepStatus = async (setIsTwoStepEnabled: React.Dispatch<React.SetStateAction<TwoStepStatus>>) => {
  try {
    const response = await fetch('/api/auth/2fa/setup/status');
    const data = await response.json();
    setIsTwoStepEnabled(data.isTwoStepEnabled || {
      authenticator: { enabled: false },
      phone: { enabled: false, phoneMasked: '' },
      email: { enabled: false, emailMasked: '' }
    });
  } catch (err) {
    console.error('Failed to fetch two-step verification status', err);
  }
};

const enableTwoStep = async (
  methodType: string,
  bodyParams: any,
  setPendingToVerify: React.Dispatch<React.SetStateAction<string>>,
  setQrCodeUrl: React.Dispatch<React.SetStateAction<string>>,
  setAuthAppDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string>>,
  setMessage: React.Dispatch<React.SetStateAction<string>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setLoading(true);
  try {
    setError('');
    setMessage('')
    const response = await fetch('/api/auth/2fa/setup/enable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ methodType, ...bodyParams }),
    });
    const data = await response.json();
    setPendingToVerify(data.id)
    if (methodType === 'authenticator') {
      setQrCodeUrl(data.qrCodeUrl);
      setAuthAppDialogOpen(true);
    }

    setMessage('');
    setError('');
  } catch (err) {
    setError('Failed to generate QR code.');
    setMessage('');
  } finally {
    setLoading(false);
  }
};

const verifyTwoStep = async (
  code: string,
  methodType: string,
  methodId: string,
  setIsTwoStepEnabled: React.Dispatch<React.SetStateAction<TwoStepStatus>>,
  setAuthAppDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setPhoneDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setEmailDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setMessage: React.Dispatch<React.SetStateAction<string>>,
  setError: React.Dispatch<React.SetStateAction<string>>
) => {
  try {
    const response = await fetch('/api/auth/2fa/setup/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, methodType, methodId }),
    });
    const data = await response.json();
    if (data.success) {
      setMessage('Two-Step Verification enabled successfully.');
      setIsTwoStepEnabled((prev) => ({
        ...prev,
        [methodType]: { enabled: true, [`${methodType}Masked`]: '' }
      }));
      if (methodType === 'authenticator') setAuthAppDialogOpen(false);
      if (methodType === 'phone') setPhoneDialogOpen(false);
      if (methodType === 'email') setEmailDialogOpen(false);
    } else {
      setError('Invalid verification code. Please try again.');
    }
  } catch (err) {
    setError('Failed to verify code.');
    setMessage('');
  }
};

interface TwoStepVerificationOptionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isEnabled: boolean;
  onEnableClick: () => void;
  maskedValue?: string;
  isLoading: boolean;
}

const TwoStepVerificationOption: React.FC<TwoStepVerificationOptionProps> = ({ icon: Icon, title, description, isEnabled, onEnableClick, maskedValue, isLoading }) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center space-x-4">
      <Icon className="w-5 h-5 text-muted-foreground" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        {isEnabled && maskedValue && <p className="text-sm text-muted-foreground">{maskedValue}</p>}
      </div>
    </div>
    <Button variant="outline" onClick={onEnableClick} disabled={isEnabled || isLoading}>
      {isLoading ? <Loader2 size="small" className="animate-spin" /> : 'Enable'}
    </Button>
  </div>
);

const TwoStepVerificationOptions: React.FC = () => {
  const [pendingMethodToVerify, setPendingMethodToVerify] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isTwoStepEnabled, setIsTwoStepEnabled] = useState<TwoStepStatus>({
    authenticator: { enabled: false },
    phone: { enabled: false, phoneMasked: '' },
    email: { enabled: false, emailMasked: '' }
  });
  const [authAppDialogOpen, setAuthAppDialogOpen] = useState<boolean>(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState<boolean>(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({
    authenticator: false,
    phone: false,
    email: false,
    backupCodes: false
  });

  useEffect(() => {
    fetchTwoStepStatus(setIsTwoStepEnabled);
  }, []);

  return (
    <div className="space-y-4">
      <AuthenticatorDialog
        open={authAppDialogOpen}
        onClose={() => setAuthAppDialogOpen(false)}
        qrCodeUrl={qrCodeUrl}
        onVerify={(code) => verifyTwoStep(code, 'authenticator', pendingMethodToVerify, setIsTwoStepEnabled, setAuthAppDialogOpen, setPhoneDialogOpen, setEmailDialogOpen, setMessage, setError)}
        error={error}
        message={message}
      />
      <PhoneAuthDialog
        open={phoneDialogOpen}
        onClose={() => setPhoneDialogOpen(false)}
        onVerify={(code) => verifyTwoStep(code, 'phone', pendingMethodToVerify, setIsTwoStepEnabled, setAuthAppDialogOpen, setPhoneDialogOpen, setEmailDialogOpen, setMessage, setError)}
        error={error}
        message={message}
        onSendOtp={function (phone: string): void {
          enableTwoStep('phone', { phoneNumber: phone }, setPendingMethodToVerify, setQrCodeUrl, setAuthAppDialogOpen, setError, setMessage, (value) => setLoading((prev: any) => ({ ...prev, authenticator: value })))
        }} />
      <EmailAuthDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        onVerify={(code) => verifyTwoStep(code, 'email', pendingMethodToVerify, setIsTwoStepEnabled, setAuthAppDialogOpen, setPhoneDialogOpen, setEmailDialogOpen, setMessage, setError)}
        error={error}
        message={message}
        onSendOtp={function (email: string): void {
          enableTwoStep('email', { email: email }, setPendingMethodToVerify, setQrCodeUrl, setAuthAppDialogOpen, setError, setMessage, (value) => setLoading((prev: any) => ({ ...prev, authenticator: value })))
        }} />

      <TwoStepVerificationOption
        icon={ShieldCheck}
        title="Authenticator App (Best Option)"
        description="Use an app like Google Authenticator or Authy to generate two-step verification codes."
        isEnabled={isTwoStepEnabled.authenticator.enabled}
        maskedValue={''}
        onEnableClick={() => enableTwoStep('authenticator', {}, setPendingMethodToVerify, setQrCodeUrl, setAuthAppDialogOpen, setError, setMessage, (value) => setLoading((prev: any) => ({ ...prev, authenticator: value })))}
        isLoading={loading.authenticator}
      />
      <Separator />
      <TwoStepVerificationOption
        icon={MessageSquare}
        title="SMS"
        description="Receive two-step verification codes via SMS on your mobile device."
        isEnabled={isTwoStepEnabled.phone.enabled}
        onEnableClick={() => {
          setPhoneDialogOpen(true);
          setLoading(prev => ({ ...prev, phone: false }));
        }}
        maskedValue={`Phone: ${isTwoStepEnabled.phone.phoneMasked}`}
        isLoading={loading.phone}
      />
      <Separator />
      <TwoStepVerificationOption
        icon={Mail}
        title="Email"
        description="Receive two-step verification codes via email."
        isEnabled={isTwoStepEnabled.email.enabled}
        onEnableClick={() => {
          setEmailDialogOpen(true);
          setLoading(prev => ({ ...prev, email: false }));
        }}
        maskedValue={`Email: ${isTwoStepEnabled.email.emailMasked}`}
        isLoading={loading.email}
      />
      {/* <Separator />
      <TwoStepVerificationOption
        icon={Mail}
        title="Backup Codes"
        description="Generate backup codes to use when other two-step verification methods are unavailable."
        isEnabled={isTwoStepEnabled.backupCodes?.enabled}
        maskedValue={''}
        onEnableClick={() => enableTwoStep('backupCodes', setQrCodeUrl, setAuthAppDialogOpen, setError, setMessage, (value) => setLoading((prev: any) => ({ ...prev, backupCodes: value })))}
        isLoading={loading.backupCodes}
      /> */}
    </div>
  );
};

export default TwoStepVerificationOptions;
