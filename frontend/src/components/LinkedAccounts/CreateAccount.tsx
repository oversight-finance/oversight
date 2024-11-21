import { useState } from "react";
import { useAccounts } from "@/contexts/AccountsContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AccountType } from "@/types/Account";
import { Dialog } from "@/components/ui/dialog";
import BankForm from "./BankForm";

const formatAccountType = (type: AccountType): string => {
  // Split camelCase and capitalize first letter of each word
  return type
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
};

export default function CreateAccount() {
  const [showFullForm, setShowFullForm] = useState(false);
  const [selectedType, setSelectedType] = useState<AccountType>(AccountType.BANK);
  const [formData, setFormData] = useState({
    accountName: "",
    accountNumber: "",
    type: AccountType.BANK,
    balance: 0,
    interestRate: 0,
  });

  if (!showFullForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Account Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select
              value={selectedType}
              onValueChange={(value: AccountType) => {
                setSelectedType(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(AccountType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatAccountType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              onClick={() => setShowFullForm(true)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Bank Account</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedType === AccountType.BANK && <BankForm />}
      </CardContent>
    </Card>
  );
}
