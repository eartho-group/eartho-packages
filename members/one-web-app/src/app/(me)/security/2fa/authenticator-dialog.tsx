import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck } from "lucide-react";

interface TwoFactorAuthDialogProps {
  open: boolean;
  onClose: () => void;
  qrCodeUrl: string;
  onVerify: (code: string) => void;
  error: string;
  message: string;
}

const TwoFactorAuthDialog: React.FC<TwoFactorAuthDialogProps> = ({ open, onClose, qrCodeUrl, onVerify, error, message }) => {
  const [verificationCode, setVerificationCode] = useState('');

  const handleVerify = () => {
    onVerify(verificationCode);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          <DialogDescription>Scan the QR code with your authenticator app and then enter the verification code from the app.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <img src={qrCodeUrl} alt="QR Code" />
          <Input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter verification code"
          />
          {error && <p className="text-red-500">{error}</p>}
          {message && <p className="text-green-500">{message}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleVerify}>Verify</Button>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorAuthDialog;
