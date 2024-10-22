"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getSession } from 'next-auth/react';

const DeleteAccountDialog: React.FC<{ onConfirm: () => void, onCancel: () => void }> = ({ onConfirm, onCancel }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const openDialog = () => setDialogOpen(true);
  const closeDialog = () => setDialogOpen(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setConfirmationText(e.target.value);

  return (
    <>
      <Button variant="default" onClick={openDialog}>Delete Account</Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account and all associated data? This action cannot be undone.
              Please type <strong>DELETE</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="text"
            value={confirmationText}
            onChange={handleChange}
            placeholder="Type DELETE to confirm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { closeDialog(); onCancel(); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { closeDialog(); onConfirm(); }}
              disabled={confirmationText !== 'DELETE'}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const DeleteMyAccount: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('An unknown error occurred');
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const session = await getSession();
      if (!session || !session.user) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: session.user.uid, confirmationText: 'DELETE' })
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      // Handle successful deletion (e.g., redirect to a goodbye page or logout)
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    // Optionally handle the cancel action
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Delete Account</CardTitle>
        <CardDescription>Permanently delete your account and all associated data.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500">{error}</p>}
        <DeleteAccountDialog
          onConfirm={handleDeleteAccount}
          onCancel={handleCancelDelete}
        />
      </CardContent>
    </Card>
  );
};

export default DeleteMyAccount;
