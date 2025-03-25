"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccounts } from "@/contexts/AccountsContext";
import AccountBalance from "@/components/AccountBalance/AccountBalance";
import { formatCurrency } from "@/lib/utils";
import { AccountType, CryptoWalletWithTransactions } from "@/types";
import CryptoWalletTransactionTable from "@/components/TransactionTables/CryptoWallet/CryptoWalletTransactionTable";
import DeleteAccountAlert from "@/components/DeleteAccountAlert/DeleteAccountAlert";

export default function CryptoWalletPage() {
  const { id } = useParams();
  const { accounts, isLoading, error } = useAccounts();

  const [balance, setBalance] = useState<number>(0);

  // Update balance when account changes
  useEffect(() => {
    if (
      !isLoading &&
      accounts &&
      id &&
      accounts[AccountType.CRYPTO]?.[id as string]
    ) {
      const account = accounts[AccountType.CRYPTO][
        id as string
      ] as CryptoWalletWithTransactions;
      setBalance(account.balance);
    }
  }, [accounts, isLoading, id]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Only access accounts after we've confirmed they're loaded
  if (!accounts || !accounts[AccountType.CRYPTO]?.[id as string]) {
    return <div>Crypto wallet not found</div>;
  }

  const cryptoWallet = accounts[AccountType.CRYPTO][
    id as string
  ] as CryptoWalletWithTransactions;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{cryptoWallet.account_name}</h1>
          <p className="text-muted-foreground">
            {cryptoWallet.coin_symbol} Wallet
          </p>
          {cryptoWallet.wallet_address && (
            <p className="text-sm text-muted-foreground mt-1 truncate max-w-xs">
              {cryptoWallet.wallet_address}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
            <div className="text-sm text-muted-foreground">Current Balance</div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <AccountBalance account={cryptoWallet} />
      </div>

      <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
        <div className="flex-1 min-w-0">
          {/* Use CryptoWalletTransactionTable for crypto transactions */}
          <CryptoWalletTransactionTable
            accountId={id as string}
            title="Crypto Transactions"
          />
        </div>
        <div className="w-full xl:w-80 shrink-0">
          <div className="p-4 border rounded-md">
            <h3 className="font-medium mb-2">Import Transactions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a CSV file to import your crypto transactions
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

      <div className="flex justify-end">
        <DeleteAccountAlert
          accountId={id as string}
          accountType={AccountType.CRYPTO}
          accountName={cryptoWallet.account_name}
        />
      </div>
    </div>
  );
}
