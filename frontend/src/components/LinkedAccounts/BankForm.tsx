import { useState } from "react";
import { useAccounts } from "@/contexts/AccountsContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AccountType } from "@/types/Account";

export default function BankForm() {
    const { addAccount } = useAccounts();
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        accountNumber: "",
        type: AccountType.BANK,
        balance: 0,
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
            name: "",
            description: "",
            accountNumber: "",
            type: AccountType.BANK,
            balance: 0,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="name">Bank Name</label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                    }
                    required
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="description">Account Description</label>
                <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
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