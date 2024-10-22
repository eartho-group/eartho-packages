"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { getSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface EmailListProps {
  emails: string[];
  onDelete: (email: string) => void;
}

const EmailList: React.FC<EmailListProps> = ({ emails, onDelete }) => (
  <div className="mt-4">
    <ul>
      {emails.map((email, index) => (
        <li key={index} className="flex items-center space-x-2">
          <ShieldCheck size={20} />
          <span className="font-medium">{email}</span>
          <Button variant="ghost" onClick={() => onDelete(email)} className="flex items-center space-x-1">
            <X size={16} />
            <span>Delete</span>
          </Button>
        </li>
      ))}
    </ul>
  </div>
);

interface AddEmailDialogProps {
  newEmail: string;
  setNewEmail: React.Dispatch<React.SetStateAction<string>>;
  otp: string;
  setOtp: React.Dispatch<React.SetStateAction<string>>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  isOtpSent: boolean;
  setIsOtpSent: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setEmails: React.Dispatch<React.SetStateAction<string[]>>;
  emails: string[];
}

const AddEmailDialog: React.FC<AddEmailDialogProps> = ({
  newEmail,
  setNewEmail,
  otp,
  setOtp,
  sendOtp,
  verifyOtp,
  isOtpSent,
  setIsOtpSent,
  setError,
  setEmails,
  emails,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    await sendOtp(newEmail);
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    await verifyOtp(otp);
    setDialogOpen(false);
    setIsOtpSent(false);
    setNewEmail("");
    setOtp("");
    setError("");
    setEmails([...emails, newEmail]);
  };

  function closeDialog() {
    setDialogOpen(false);
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="text-blue-600">
          Verify New Email
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Email</DialogTitle>
          <DialogDescription>Enter your email to receive an OTP</DialogDescription>
        </DialogHeader>
        {!isOtpSent ? (
          <form onSubmit={handleSendOtp}>
            <label htmlFor="new-email" className="block mb-2">
              Email:
            </label>
            <Input
              type="email"
              id="new-email"
              name="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <DialogFooter className="mt-4">
              <Button type="submit">Send Code</Button>
              <DialogClose asChild>
                <Button variant="outline" onClick={closeDialog}>
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <label htmlFor="otp" className="block mb-2">
              Code:
            </label>
            <Input
              type="text"
              id="otp"
              name="otp"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <DialogFooter className="mt-4">
              <Button type="submit">Verify Email</Button>
              <DialogClose asChild>
                <Button variant="outline" onClick={closeDialog}>
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

const DeleteEmailDialog: React.FC<{ email: string; onConfirm: () => void; onCancel: () => void }> = ({ email, onConfirm, onCancel }) => {
  const [dialogOpen, setDialogOpen] = useState(true);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>Are you sure you want to delete {email}?</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const VerifiedEmails: React.FC = () => {
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const session = await getSession();
        if (session?.user?.verifiedEmails) {
          setEmails(session.user.verifiedEmails);
        }
      } catch (err) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, []);

  const sendOtp = async (email: string) => {
    try {
      const response = await fetch("/api/auth/verify/email/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }
      setIsOtpSent(true);
    } catch (error) {
      handleError(error);
    }
  };

  const verifyOtp = async (otp: string) => {
    try {
      const response = await fetch("/api/auth/verify/email/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newEmail, otp }),
      });
      if (!response.ok) {
        throw new Error("Failed to verify OTP");
      }
      const result = await response.json();
      setEmails([...emails, result.email]);
    } catch (error) {
      handleError(error);
    }
  };

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("An unknown error occurred");
    }
  };

  const handleDelete = (email: string) => {
    setEmailToDelete(email);
  };

  const confirmDelete = async () => {
    if (emailToDelete) {
      try {
        const response = await fetch("/api/auth/verify/email/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: emailToDelete }),
        });
        if (!response.ok) {
          throw new Error("Failed to delete email");
        }
        setEmails(emails.filter((email) => email !== emailToDelete));
        setEmailToDelete(null);
      } catch (error) {
        handleError(error);
        setEmailToDelete(null);
      }
    }
  };

  const cancelDelete = () => {
    setEmailToDelete(null);
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Verified Emails</CardTitle>
        <CardDescription>Manage your verified emails</CardDescription>
      </CardHeader>
      <CardContent>
        <p>View and add your verified emails.</p>
        {loading ? (
          <Skeleton className="mt-4 h-6 w-[250px]" />
        ) : error ? (
          <p className="mt-4 text-red-600">{error}</p>
        ) : (
          <EmailList emails={emails} onDelete={handleDelete} />
        )}
      </CardContent>

      {/* Bottom Button Section */}
      <Separator />
      <div className=" p-4">
        <AddEmailDialog
          newEmail={newEmail}
          setNewEmail={setNewEmail}
          otp={otp}
          setOtp={setOtp}
          sendOtp={sendOtp}
          verifyOtp={verifyOtp}
          isOtpSent={isOtpSent}
          setIsOtpSent={setIsOtpSent}
          setError={setError}
          setEmails={setEmails}
          emails={emails}
        />
      </div>

      {/* Delete Dialog */}
      {emailToDelete && (
        <DeleteEmailDialog email={emailToDelete} onConfirm={confirmDelete} onCancel={cancelDelete} />
      )}
    </Card>
  );
};

export default VerifiedEmails;
