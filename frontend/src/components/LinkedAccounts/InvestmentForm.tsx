import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/contexts/AccountsContext";
import { toast } from "@/hooks/use-toast";
import { AccountType, InvestmentAccount } from "@/types/Account";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogClose } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
// Define common investment types
const investmentTypes = ["RRSP", "TFSA", "401k", "IRA", "General", "Other"];

// Define common currencies
const currencies = ["USD", "CAD", "EUR", "GBP", "JPY", "AUD"];

// Define common financial institutions
const commonInstitutions = [
  "Wealthsimple",
  "RBC",
  "TD",
  "Scotiabank",
  "BMO",
  "CIBC",
  "National Bank",
  "Desjardins",
  "Questrade",
  "CI Direct Investing",
  "HSBC Canada",
  "Tangerine",
  "EQ Bank",
  "Laurentian Bank",
  "ATB Financial",
  "Manulife",
  "Sun Life",
  "Canada Life",
];

export default function InvestmentForm() {
  const { addAccount } = useAccounts();
  const { getUserId } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const [formData, setFormData] = useState({
    account_name: "",
    investment_type: "General",
    institution: "",
    account_number: "",
    contribution_room: "",
    balance: 0,
    currency: "CAD",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const userId = await getUserId();

      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not available. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const account = {
        account_type: AccountType.INVESTMENT,
        account_name: formData.account_name,
        user_id: userId,
        investment_type: formData.investment_type,
        institution: formData.institution,
        account_number: formData.account_number || undefined,
        contribution_room: formData.contribution_room
          ? parseFloat(formData.contribution_room)
          : undefined,
        balance: formData.balance,
        currency: formData.currency,
      };

      const result = (await addAccount(
        account as InvestmentAccount
      )) as InvestmentAccount;

      console.log("result", result);

      if (result) {
        toast({
          title: "Success",
          description: "Investment account added successfully",
        });

        // Close the dialog using the DialogClose ref
        if (dialogCloseRef.current) {
          dialogCloseRef.current.click();
        }

        // Reset form
        setFormData({
          account_name: "",
          investment_type: "General",
          institution: "",
          account_number: "",
          contribution_room: "",
          balance: 0,
          currency: "CAD",
        });

        router.push(`/accounts/investment/${result.id}`);
      } else {
        throw new Error("Failed to create investment account FORM");
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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-2"
    >
      {/* Hidden DialogClose component that we can click programmatically */}
      <DialogClose ref={dialogCloseRef} className="hidden" />

      <div className="space-y-2">
        <label htmlFor="account_name">Account Name</label>
        <Input
          id="account_name"
          value={formData.account_name}
          onChange={(e) =>
            setFormData({ ...formData, account_name: e.target.value })
          }
          placeholder="My Retirement Account"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="investment_type">Account Type</label>
        <Select
          value={formData.investment_type}
          onValueChange={(value) =>
            setFormData({ ...formData, investment_type: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select account type" />
          </SelectTrigger>
          <SelectContent>
            {investmentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Select the type of investment account
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="institution">Financial Institution</label>
        <Input
          id="institution"
          value={formData.institution}
          onChange={(e) =>
            setFormData({ ...formData, institution: e.target.value })
          }
          placeholder="Vanguard"
          list="institution-options"
          required
        />
        <datalist id="institution-options">
          {commonInstitutions.map((institution) => (
            <option key={institution} value={institution} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <label htmlFor="account_number">Account Number (Optional)</label>
        <Input
          id="account_number"
          value={formData.account_number}
          onChange={(e) =>
            setFormData({ ...formData, account_number: e.target.value })
          }
          placeholder="XXXX-XXXX-XXXX"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="contribution_room">Contribution Room (Optional)</label>
        <Input
          id="contribution_room"
          type="number"
          step="any"
          min="0"
          value={formData.contribution_room}
          onChange={(e) =>
            setFormData({ ...formData, contribution_room: e.target.value })
          }
          placeholder="0.00"
        />
        <p className="text-sm text-muted-foreground">
          For tax-advantaged accounts like RRSP or TFSA
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="balance">Current Balance</label>
        <Input
          id="balance"
          type="number"
          step="any"
          min="0"
          value={formData.balance}
          onChange={(e) =>
            setFormData({ ...formData, balance: Number(e.target.value) })
          }
          placeholder="0.00"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="currency">Currency</label>
        <Select
          value={formData.currency}
          onValueChange={(value) =>
            setFormData({ ...formData, currency: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((currency) => (
              <SelectItem key={currency} value={currency}>
                {currency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Investment Account"}
      </Button>
    </form>
  );
}
