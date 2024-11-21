import { useState } from "react";
import { useAccounts } from "@/contexts/AccountsContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function LinkedAccounts() {
  const { accounts, removeAccount } = useAccounts();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const handleAccountClick = (accountId: string) => {
    setSelectedAccount(accountId);
  };

  const handleClose = () => {
    setSelectedAccount(null);
  };

  const handleDelete = (accountId: string) => {
    removeAccount(accountId);
    handleClose();
  };

  const selectedAccountDetails = accounts.find(
    (account) => account.id === selectedAccount
  );

  if (accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No accounts linked yet. Click on &quot;Link Accounts&quot; in the
          sidebar to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground hover:bg-accent cursor-pointer transition-colors"
              onClick={() => handleAccountClick(account.id)}
            >
              <div className="space-y-1">
                <p className="font-medium">{account.bankName}</p>
                <p className="text-sm text-muted-foreground">
                  {account.accountType.charAt(0).toUpperCase() +
                    account.accountType.slice(1)}{" "}
                  ••••
                  {account.accountNumber.slice(-4)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(account.balance)}</p>
                <p className="text-sm text-muted-foreground">
                  Updated {account.lastUpdated.toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedAccount}
        onOpenChange={() => setSelectedAccount(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Account Details</DialogTitle>
          </DialogHeader>
          {selectedAccountDetails && (
            <>
              <div className="grid gap-4 py-4">
                <div className="space-y-4">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium">Bank Name</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAccountDetails.bankName}
                    </p>
                  </div>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium">Account Type</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAccountDetails.accountType
                        .charAt(0)
                        .toUpperCase() +
                        selectedAccountDetails.accountType.slice(1)}
                    </p>
                  </div>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium">Account Number</p>
                    <p className="text-sm text-muted-foreground">
                      •••• {selectedAccountDetails.accountNumber.slice(-4)}
                    </p>
                  </div>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium">Current Balance</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(selectedAccountDetails.balance)}
                    </p>
                  </div>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAccountDetails.lastUpdated.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedAccountDetails.id)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Account
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
              </CardFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
