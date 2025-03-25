"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccounts } from "@/contexts/AccountsContext";
import AccountBalance from "@/components/AccountBalance/AccountBalance";
import { formatCurrency } from "@/lib/utils";
import {
  AccountType,
  BankAccountTransaction,
  BankAccountWithTransactions,
} from "@/types";
import BankTransactionTable from "@/components/TransactionTables/BankAccount/BankTransactionTable";

// Helper to calculate account balance from transactions
const calculateAccountBalance = (
  transactions: BankAccountTransaction[]
): number => {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
};

export default function AccountPage() {
  const { id } = useParams();
  const { accounts, isLoading, error } = useAccounts();

  const [balance, setBalance] = useState<number>(0);

  // Update balance when account changes
  useEffect(() => {
    if (
      !isLoading &&
      accounts &&
      id &&
      accounts[AccountType.BANK]?.[id as string]
    ) {
      const account = accounts[AccountType.BANK][
        id as string
      ] as BankAccountWithTransactions;
      setBalance(account.balance);
    }
  }, [accounts, isLoading, id]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Only access accounts after we've confirmed they're loaded
  if (!accounts || !accounts[AccountType.BANK]?.[id as string]) {
    return <div>Account not found</div>;
  }

  const account = accounts[AccountType.BANK][
    id as string
  ] as BankAccountWithTransactions;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">
            Account - {account.account_name}
          </h1>
          <p className="text-muted-foreground">Manage your transactions</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
          <div className="text-sm text-muted-foreground">Current Balance</div>
        </div>
      </div>

      <div className="w-full">
        <AccountBalance account={account} />
      </div>

      <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
        <div className="flex-1 min-w-0">
          {/* Use BankTransactionTable which handles all transaction operations internally */}
          <BankTransactionTable accountId={id as string} title="Transactions" />
        </div>
        <div className="w-full xl:w-80 shrink-0">
          <div className="p-4 border rounded-md">
            <h3 className="font-medium mb-2">Import Transactions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a CSV file to import your transactions
            </p>
            <button
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md"
              onClick={() => alert("CSV Uploader not implemented yet")}
            >
              Upload CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
