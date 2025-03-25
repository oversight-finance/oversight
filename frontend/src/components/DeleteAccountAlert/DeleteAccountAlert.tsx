"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AccountType } from "@/types/Account";
import { useAccounts } from "@/contexts/AccountsContext";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteAccountAlertProps {
  accountId: string;
  accountType: AccountType;
  accountName?: string;
  redirectPath?: string;
}

export default function DeleteAccountAlert({
  accountId,
  accountType,
  accountName,
  redirectPath = "/dashboard",
}: DeleteAccountAlertProps) {
  const router = useRouter();
  const { deleteAccount } = useAccounts();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!accountId) return;

    setIsDeleting(true);
    try {
      const success = await deleteAccount(accountType, accountId);
      if (success) {
        setDeleteDialogOpen(false);
        // Navigate back to accounts page
        router.push(redirectPath);
      } else {
        console.error("Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const accountTypeLabels = {
    [AccountType.BANK]: "bank account",
    [AccountType.CRYPTO]: "crypto wallet",
    [AccountType.INVESTMENT]: "investment account",
    [AccountType.CREDIT]: "credit account",
    [AccountType.SAVINGS]: "savings account",
  };

  const accountTypeLabel = accountTypeLabels[accountType];

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setDeleteDialogOpen(true)}
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Delete
      </Button>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {accountName || accountTypeLabel}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {accountTypeLabel}? This will
              permanently remove the account and all associated transactions.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
