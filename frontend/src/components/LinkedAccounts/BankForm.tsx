import { useState } from "react";
import { useAccounts } from "@/contexts/AccountsContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AccountType } from "@/types/Account";

export default function BankForm() {
    const { addAccount } = useAccounts();
    const [formData, setFormData] = useState({
        bankName: "",
        accountNumber: "",
        accountType: AccountType.BANK,
        balance: 0,
        userId: "user1", // Default user ID
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addAccount(formData);

        // Find and close the dialog using the DialogClose component
        const closeButton = document.querySelector('[data-dialog-close]') as HTMLButtonElement;
        if (closeButton) {
            closeButton.click();
        }

        // Reset form
        setFormData({
            bankName: "",
            accountNumber: "",
            accountType: AccountType.BANK,
            balance: 0,
            userId: "user1",
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="bankName">Bank Name</label>
                <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) =>
                        setFormData({ ...formData, bankName: e.target.value })
                    }
                    required
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="accountNumber">Account Number</label>
                <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) =>
                        setFormData({ ...formData, accountNumber: e.target.value })
                    }
                    required
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="balance">Current Balance</label>
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