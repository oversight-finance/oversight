"use client";

import { useState } from "react";
import { useAccounts } from "@/contexts/AccountsContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createInvestmentAccount } from "@/database/InvestmentAccounts";
import { InvestmentAccount } from "@/types/Account";
import { useAuth } from "@/contexts/AuthContext";
import { AccountType } from "@/types/Account";
import { toast } from "@/hooks/use-toast";

interface InvestmentFormProps {
  onSuccess?: () => void;
}

export default function InvestmentForm({ onSuccess }: InvestmentFormProps) {
  const { getUserId } = useAuth();
  const { refreshAccounts } = useAccounts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    account_type: "TFSA" as string,
    institution: "",
    account_name: "",
    account_number: "",
    contribution_room: 0,
    balance: 0,
    currency: "CAD",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user ID
      const userId = getUserId();
      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not available. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      // Create the investment account
      const newAccountId = await createInvestmentAccount(userId, formData as any);

      if (newAccountId) {
        toast({
          title: "Success",
          description: "Investment account added successfully",
        });

        // Refresh accounts to update the UI
        await refreshAccounts();

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          // Only use dialog close button if no callback provided
          const closeButton = document.querySelector("[data-dialog-close]") as HTMLButtonElement;
          if (closeButton) {
            closeButton.click();
          }
        }

        // Reset form
        setFormData({
          account_type: "TFSA" as string,
          institution: "",
          account_name: "",
          account_number: "",
          contribution_room: 0,
          balance: 0,
          currency: "CAD",
        });
      } else {
        throw new Error("Failed to create investment account");
      }
    } catch (error) {
      console.error("Error creating investment account:", error);
      toast({
        title: "Error",
        description: "Failed to create investment account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="account_type">Account Type</label>
        <Select
          value={formData.account_type}
          onValueChange={(value: "RRSP" | "TFSA" | "General") =>
            setFormData({
              ...formData,
              account_type: value,
            })
          }
        >
          <SelectTrigger id="account_type">
            <SelectValue placeholder="Select Account Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RRSP">RRSP</SelectItem>
            <SelectItem value="TFSA">TFSA</SelectItem>
            <SelectItem value="General">General Investment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="account_name">Account Name</label>
        <Input
          id="account_name"
          value={formData.account_name}
          onChange={(e) =>
            setFormData({
              ...formData,
              account_name: e.target.value,
            })
          }
          required
          placeholder="e.g., My TFSA, Retirement RRSP"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="institution">Institution</label>
        <Input
          id="institution"
          value={formData.institution}
          onChange={(e) =>
            setFormData({
              ...formData,
              institution: e.target.value,
            })
          }
          required
          placeholder="e.g., Questrade, Wealthsimple"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="account_number">Account Number</label>
        <Input
          id="account_number"
          value={formData.account_number}
          onChange={(e) =>
            setFormData({
              ...formData,
              account_number: e.target.value,
            })
          }
          placeholder="Optional"
        />
      </div>

      {(formData.account_type === "RRSP" || formData.account_type === "TFSA") && (
        <div className="space-y-2">
          <label htmlFor="contribution_room">Contribution Room</label>
          <Input
            id="contribution_room"
            type="number"
            value={formData.contribution_room}
            onChange={(e) =>
              setFormData({
                ...formData,
                contribution_room: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="Available contribution room"
          />
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="balance">Current Balance</label>
        <Input
          id="balance"
          type="number"
          step="any"
          min="0"
          value={formData.balance}
          onChange={(e) =>
            setFormData({
              ...formData,
              balance: parseFloat(e.target.value) || 0,
            })
          }
          required
          placeholder="Current account balance"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="currency">Currency</label>
        <Select
          value={formData.currency}
          onValueChange={(value: string) =>
            setFormData({
              ...formData,
              currency: value,
            })
          }
        >
          <SelectTrigger id="currency">
            <SelectValue placeholder="Select Currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CAD">CAD</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Investment Account"}
      </Button>
    </form>
  );
}
