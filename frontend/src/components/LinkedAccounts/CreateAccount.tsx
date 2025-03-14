import { useState, useEffect } from "react";
import { useAccounts } from "@/contexts/AccountsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
};

interface CreateAccountProps {
  defaultType?: AccountType;
}

export default function CreateAccount({
  defaultType = AccountType.BANK,
}: CreateAccountProps) {
  const [showFullForm, setShowFullForm] = useState(false);
  const [selectedType, setSelectedType] = useState<AccountType>(defaultType);
  const [formData, setFormData] = useState({
    accountName: "",
    accountNumber: "",
    type: AccountType.BANK,
    balance: 0,
    interestRate: 0,
  });

  // Update selected type when defaultType changes
  useEffect(() => {
    setSelectedType(defaultType);
    if (defaultType !== AccountType.BANK) {
      setShowFullForm(true);
    }
  }, [defaultType]);

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
            <Button className="w-full" onClick={() => setShowFullForm(true)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get the appropriate title based on the selected account type
  const getFormTitle = () => {
    switch (selectedType) {
      case AccountType.BANK:
        return "Create New Bank Account";
      case AccountType.INVESTMENT:
        return "Add New Investment Account";
      case AccountType.OTHER:
        return "Add New Account";
      default:
        return "Add New Account";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getFormTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedType === AccountType.BANK && <BankForm />}
        {selectedType !== AccountType.BANK && (
          <div className="p-4 text-center text-muted-foreground">
            <p>This account type is not yet implemented.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowFullForm(false)}
            >
              Go Back
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
