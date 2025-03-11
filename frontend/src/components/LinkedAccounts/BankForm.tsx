import { useState } from "react";
import { useAccounts } from "@/contexts/AccountsContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AccountType } from "@/types/Account";

export default function BankForm() {
  const { addAccount } = useAccounts();
  const [formData, setFormData] = useState({
    account_name: "",
    account_type: AccountType.BANK,
    account_number: "",
    balance: 0, // This will be used to create an initial transaction
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAccount(formData);

    // Find and close the dialog using the DialogClose component
    const closeButton = document.querySelector(
      "[data-dialog-close]"
    ) as HTMLButtonElement;
    if (closeButton) {
      closeButton.click();
    }

    // Reset form
    setFormData({
      account_name: "",
      account_type: AccountType.BANK,
      account_number: "",
      balance: 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="account_name">Bank Name</label>
        <Input
          id="account_name"
          value={formData.account_name}
          onChange={(e) =>
            setFormData({ ...formData, account_name: e.target.value })
          }
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="account_type">Account Type</label>
        <Input
          id="account_type"
          value={formData.account_type}
          onChange={(e) =>
            setFormData({
              ...formData,
              account_type: e.target.value as AccountType,
            })
          }
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="account_number">Account Number</label>
        <Input
          id="account_number"
          value={formData.account_number}
          onChange={(e) =>
            setFormData({ ...formData, account_number: e.target.value })
          }
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="balance">Initial Balance</label>
        <Input
          id="balance"
          type="number"
          value={formData.balance}
          onChange={(e) =>
            setFormData({ ...formData, balance: Number(e.target.value) })
          }
          required
        />
      </div>

      <Button type="submit" className="w-full">
        Create Bank Account
      </Button>
    </form>
  );
}
