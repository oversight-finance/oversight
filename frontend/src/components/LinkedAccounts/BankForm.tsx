import { useState } from "react";
import { createBankAccount } from "@/database/BankAccounts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BankAccountType } from "@/types/Account";
import { useAccounts } from "@/contexts/AccountsContext";

export default function BankForm() {
  const { getCurrentUserId } = useAccounts();
  const [formData, setFormData] = useState({
    account_name: "",
    institution_name: "",
    account_number: "",
    routing_number: "",
    currency: "USD",
    balance: 0,
    account_type: BankAccountType.CHECKING,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = await getCurrentUserId();

    if (userId) {
      createBankAccount(userId, {
        account_name: formData.account_name,
        institution_name: formData.institution_name,
        account_number: formData.account_number,
        routing_number: formData.routing_number,
        currency: formData.currency,
        balance: formData.balance,
      });
    }

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
      institution_name: "",
      account_number: "",
      routing_number: "",
      currency: "USD",
      balance: 0,
      account_type: BankAccountType.CHECKING,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="account_name">Account Name</label>
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
        <label htmlFor="institution_name">Bank/Institution Name</label>
        <Input
          id="institution_name"
          value={formData.institution_name}
          onChange={(e) =>
            setFormData({ ...formData, institution_name: e.target.value })
          }
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="account_type">Account Type</label>
        <select
          id="account_type"
          value={formData.account_type}
          onChange={(e) =>
            setFormData({
              ...formData,
              account_type: e.target.value as BankAccountType,
            })
          }
          className="w-full p-2 border rounded"
          required
        >
          <option value={BankAccountType.CHECKING}>Checking</option>
          <option value={BankAccountType.SAVINGS}>Savings</option>
          <option value={BankAccountType.CREDIT}>Credit</option>
        </select>
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
        <label htmlFor="routing_number">Routing Number</label>
        <Input
          id="routing_number"
          value={formData.routing_number}
          onChange={(e) =>
            setFormData({ ...formData, routing_number: e.target.value })
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
