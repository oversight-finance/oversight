"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAccounts } from "@/contexts/AccountsContext";
import AccountBalance from "@/components/AccountBalance/AccountBalance";
import { formatCurrency } from "@/lib/utils";
import {
  AccountType,
  CryptoWalletTransaction,
  CryptoWalletWithTransactions,
} from "@/types";
import CryptoWalletTransactionTable from "@/components/TransactionTables/CryptoWallet/CryptoWalletTransactionTable";
import DeleteAccountAlert from "@/components/DeleteAccountAlert/DeleteAccountAlert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CryptoWalletPage() {
  const { id } = useParams();
  const { accounts, isLoading, error } = useAccounts();

  const [balance, setBalance] = useState<number>(0);

  // Calculate crypto holdings from transactions
  const holdings = useMemo(() => {
    if (!accounts?.[AccountType.CRYPTO]?.[id as string]) return [];

    const account = accounts[AccountType.CRYPTO][
      id as string
    ] as CryptoWalletWithTransactions;
    const transactions = account.transactions || [];
    const symbol = account.coin_symbol;

    // Group by coin and calculate totals
    const holdingsMap = new Map<
      string,
      {
        symbol: string;
        quantity: number;
        averageCost: number;
        totalValue: number;
        totalCost: number;
        gain: number;
        gainPercent: number;
        currentPrice: number;
      }
    >();

    transactions.forEach((t: CryptoWalletTransaction) => {
      const price = t.price_at_transaction || 0;
      // Calculate quantity from amount and price
      const quantity = price > 0 ? Math.abs(t.amount) / price : 0;
      const value = Math.abs(t.amount);

      // Skip if incomplete data
      if (quantity <= 0 || price <= 0) return;

      if (!holdingsMap.has(symbol)) {
        holdingsMap.set(symbol, {
          symbol,
          quantity: 0,
          averageCost: 0,
          totalValue: 0,
          totalCost: 0,
          gain: 0,
          gainPercent: 0,
          currentPrice: price, // Using last transaction price as current price
        });
      }

      const current = holdingsMap.get(symbol)!;

      if (t.transaction_type === "buy") {
        current.quantity += quantity;
        current.totalCost += value;
        current.currentPrice = price; // Update current price
      } else if (t.transaction_type === "sell") {
        current.quantity -= quantity;
        current.currentPrice = price; // Update current price
      }

      // Only update if we still hold the crypto
      if (current.quantity > 0) {
        current.averageCost = current.totalCost / current.quantity;
        current.totalValue = current.quantity * current.currentPrice;
        current.gain = current.totalValue - current.totalCost;
        current.gainPercent = (current.gain / current.totalCost) * 100;
      } else if (current.quantity <= 0) {
        // Remove if fully sold
        holdingsMap.delete(symbol);
      }
    });

    return Array.from(holdingsMap.values());
  }, [accounts, id]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (!accounts?.[AccountType.CRYPTO]?.[id as string])
      return {
        totalContributions: 0,
        totalWithdrawals: 0,
        netContributions: 0,
        totalGain: 0,
        totalGainPercent: 0,
      };

    const account = accounts[AccountType.CRYPTO][
      id as string
    ] as CryptoWalletWithTransactions;
    const transactions = account.transactions || [];

    let totalContributions = 0;
    let totalWithdrawals = 0;

    transactions.forEach((t: CryptoWalletTransaction) => {
      if (t.transaction_type === "buy") {
        totalContributions += Math.abs(t.amount);
      } else if (t.transaction_type === "sell") {
        totalWithdrawals += Math.abs(t.amount);
      }
    });

    const netContributions = totalContributions - totalWithdrawals;
    const totalGain = balance - netContributions;
    const totalGainPercent =
      netContributions > 0 ? (totalGain / netContributions) * 100 : 0;

    return {
      totalContributions,
      totalWithdrawals,
      netContributions,
      totalGain,
      totalGainPercent,
    };
  }, [accounts, id, balance]);
  // Calculate balance from transactions
  const calculateWalletBalance = (transactions: CryptoWalletTransaction[]) => {
    return transactions.reduce((sum, tx) => {
      if (tx.transaction_type === "buy" || tx.transaction_type === "transfer") {
        return sum + tx.amount * tx.price_at_transaction;
      } else if (tx.transaction_type === "sell") {
        return sum - tx.amount * tx.price_at_transaction;
      }
      return sum;
    }, 0);
  };

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
      const calculatedBalance = calculateWalletBalance(
        account.transactions || []
      );
      setBalance(calculatedBalance);
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

  // Transform transactions to use fiat values
  const walletWithFiatTransactions = {
    ...cryptoWallet,
    transactions: cryptoWallet.transactions.map((tx) => ({
      ...tx,
      amount: tx.amount * tx.price_at_transaction,
    })),
  };

  console.log(walletWithFiatTransactions);

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
        <AccountBalance account={walletWithFiatTransactions} />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Net Contributions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(performanceMetrics.netContributions)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatCurrency(performanceMetrics.totalContributions)}{" "}
              contributed, {formatCurrency(performanceMetrics.totalWithdrawals)}{" "}
              withdrawn
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(performanceMetrics.totalGain)}
            </div>
            <div
              className={`text-xs ${
                performanceMetrics.totalGainPercent >= 0
                  ? "text-green-500"
                  : "text-red-500"
              } mt-1`}
            >
              {performanceMetrics.totalGainPercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Current Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {holdings.length} {holdings.length === 1 ? "Asset" : "Assets"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      {holdings.length > 0 && (
        <div className="rounded-md border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Crypto Holdings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-3 text-left font-medium text-sm">Symbol</th>
                  <th className="p-3 text-right font-medium text-sm">
                    Quantity
                  </th>
                  <th className="p-3 text-right font-medium text-sm">
                    Avg. Cost
                  </th>
                  <th className="p-3 text-right font-medium text-sm">
                    Current Price
                  </th>
                  <th className="p-3 text-right font-medium text-sm">
                    Market Value
                  </th>
                  <th className="p-3 text-right font-medium text-sm">
                    Gain/Loss
                  </th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding.symbol} className="border-t">
                    <td className="p-3 font-medium">{holding.symbol}</td>
                    <td className="p-3 text-right">
                      {holding.quantity.toFixed(6)}
                    </td>
                    <td className="p-3 text-right">
                      {formatCurrency(holding.averageCost)}
                    </td>
                    <td className="p-3 text-right">
                      {formatCurrency(holding.currentPrice)}
                    </td>
                    <td className="p-3 text-right">
                      {formatCurrency(holding.totalValue)}
                    </td>
                    <td
                      className={`p-3 text-right ${
                        holding.gain >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {formatCurrency(holding.gain)} (
                      {holding.gainPercent.toFixed(2)}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
        <div className="flex-1 min-w-0">
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
