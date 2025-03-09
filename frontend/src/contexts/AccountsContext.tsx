"use client";

import { createContext, useContext, useState } from "react";
import { Account, AccountType } from "../types/Account";
import { dummyAccounts } from "../data/dummyAccounts";
import { createInitialTransaction } from "@/lib/accountHelpers";

interface AccountsContextType {
  accounts: Account[];
  addAccount: (
    account: Omit<Account, "id" | "transactions" | "createdAt">
  ) => void;
  removeAccount: (id: string) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
}

const AccountsContext = createContext<AccountsContextType | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(dummyAccounts);
  const addAccount = (
    newAccount: Omit<Account, "id" | "transactions" | "createdAt">
  ) => {
    const now = new Date().toISOString();
    const initialTransaction = {
      ...createInitialTransaction(newAccount.balance),
      id: crypto.randomUUID(),
    };

    const account = {
      ...newAccount,
      id: crypto.randomUUID(),
      transactions: [initialTransaction],
      createdAt: now,
      metadata: newAccount.metadata || {},
    };

    setAccounts((current) => [...current, account]);
    console.log("add account", accounts);
  };

  const removeAccount = (id: string) => {
    setAccounts((current) => current.filter((account) => account.id !== id));
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts((current) =>
      current.map((account) =>
        account.id === id ? { ...account, ...updates } : account
      )
    );
  };

  return (
    <AccountsContext.Provider
      value={{ accounts, addAccount, removeAccount, updateAccount }}
    >
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error("useAccounts must be used within an AccountsProvider");
  }
  return context;
}
