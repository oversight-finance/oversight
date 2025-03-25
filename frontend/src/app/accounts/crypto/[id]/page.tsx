"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchCryptoWallet } from "@/database/CryptoWallets";
import AccountBalance from "@/components/AccountBalance/AccountBalance";
import { formatCurrency } from "@/lib/utils";
import { CryptoWallet } from "@/types/Account";
import CryptoWalletTransactionTable from "@/components/TransactionTables/CryptoWallet/CryptoWalletTransactionTable";

export default function CryptoWalletPage() {
  const { id } = useParams();
  const [cryptoWallet, setCryptoWallet] = useState<CryptoWallet | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch crypto wallet data
  useEffect(() => {
    const loadCryptoWallet = async () => {
      setIsLoading(true);
      try {
        const wallet = await fetchCryptoWallet(id as string);
        setCryptoWallet(wallet);
        if (!wallet) {
          setError("Crypto wallet not found");
        }
      } catch (err) {
        console.error("Error fetching crypto wallet:", err);
        setError("Failed to load crypto wallet data");
      } finally {
        setIsLoading(false);
      }
    };

    loadCryptoWallet();
  }, [id]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!cryptoWallet) return <div>Crypto wallet not found</div>;

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
        <div className="text-right">
          <div className="text-2xl font-bold">
            {formatCurrency(cryptoWallet.balance)}
          </div>
          <div className="text-sm text-muted-foreground">Current Balance</div>
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
    </div>
  );
}
