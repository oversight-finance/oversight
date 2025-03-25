"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAccounts } from "@/contexts/AccountsContext";
import AccountBalance from "@/components/AccountBalance/AccountBalance";
import { formatCurrency } from "@/lib/utils";
import { AccountType, InvestmentAccount, InvestmentTransaction } from "@/types";
import InvestmentTransactionTable from "@/components/TransactionTables/Investment/InvestmentTransactionTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DeleteAccountAlert from "@/components/DeleteAccountAlert/DeleteAccountAlert";

export default function InvestmentAccountPage() {
  const { id } = useParams();
  const { accounts, isLoading, error } = useAccounts();

  const [balance, setBalance] = useState<number>(0);

  // Group holdings by ticker symbol
  const holdings = useMemo(() => {
    if (!accounts?.[AccountType.INVESTMENT]?.[id as string]) return [];

    const account = accounts[AccountType.INVESTMENT][id as string];
    const transactions = account.transactions as InvestmentTransaction[];

    // Group by ticker and calculate totals
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
      }
    >();

    transactions.forEach((t) => {
      if (
        !t.ticker_symbol ||
        t.transaction_type === "dividend" ||
        t.transaction_type === "contribution" ||
        t.transaction_type === "withdrawal"
      )
        return;

      const symbol = t.ticker_symbol;
      const quantity = t.quantity || 0;
      const price = t.price_per_unit || 0;
      const value = quantity * price;

      // Skip if incomplete data
      if (!quantity || !price) return;

      if (!holdingsMap.has(symbol)) {
        holdingsMap.set(symbol, {
          symbol,
          quantity: 0,
          averageCost: 0,
          totalValue: 0,
          totalCost: 0,
          gain: 0,
          gainPercent: 0,
        });
      }

      const current = holdingsMap.get(symbol)!;

      if (t.transaction_type === "buy") {
        current.quantity += quantity;
        current.totalCost += value;
      } else if (t.transaction_type === "sell") {
        current.quantity -= quantity;
        // We don't adjust totalCost for sells as we're tracking average cost basis
      }

      // Only update if we still hold the security
      if (current.quantity > 0) {
        current.averageCost = current.totalCost / current.quantity;
        current.totalValue = current.quantity * price; // Using last price as current price
        current.gain = current.totalValue - current.totalCost;
        current.gainPercent = (current.gain / current.totalCost) * 100;
      } else {
        // Remove if fully sold
        holdingsMap.delete(symbol);
      }
    });

    return Array.from(holdingsMap.values());
  }, [accounts, id]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (!accounts?.[AccountType.INVESTMENT]?.[id as string])
      return {
        totalContributions: 0,
        totalWithdrawals: 0,
        netContributions: 0,
        totalDividends: 0,
        totalGain: 0,
        totalGainPercent: 0,
      };

    const account = accounts[AccountType.INVESTMENT][id as string];
    const transactions = account.transactions as InvestmentTransaction[];

    let totalContributions = 0;
    let totalWithdrawals = 0;
    let totalDividends = 0;

    transactions.forEach((t) => {
      if (t.transaction_type === "contribution") {
        totalContributions += t.amount;
      } else if (t.transaction_type === "withdrawal") {
        totalWithdrawals += t.amount;
      } else if (t.transaction_type === "dividend") {
        totalDividends += t.amount;
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
      totalDividends,
      totalGain,
      totalGainPercent,
    };
  }, [accounts, id, balance]);

  // Update balance when account changes
  useEffect(() => {
    if (
      !isLoading &&
      accounts &&
      id &&
      accounts[AccountType.INVESTMENT]?.[id as string]
    ) {
      const account = accounts[AccountType.INVESTMENT][
        id as string
      ] as InvestmentAccount;
      setBalance(account.balance);
    }
  }, [accounts, isLoading, id]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Only access accounts after we've confirmed they're loaded
  if (!accounts || !accounts[AccountType.INVESTMENT]?.[id as string]) {
    return <div>Investment account not found</div>;
  }

  const investmentAccount = accounts[AccountType.INVESTMENT][
    id as string
  ] as InvestmentAccount;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">
            {investmentAccount.account_name}
          </h1>
          <p className="text-muted-foreground">
            {investmentAccount.investment_type} -{" "}
            {investmentAccount.institution}
          </p>
          {investmentAccount.account_number && (
            <p className="text-sm text-muted-foreground mt-1">
              Account #{investmentAccount.account_number}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
          <div className="text-sm text-muted-foreground">Current Balance</div>
          {investmentAccount.contribution_room !== undefined && (
            <div className="text-sm mt-1">
              <span className="font-medium">Contribution Room:</span>{" "}
              {formatCurrency(investmentAccount.contribution_room)}
            </div>
          )}
        </div>
      </div>

      <div className="w-full">
        <AccountBalance account={investmentAccount} />
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
              Dividend Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(performanceMetrics.totalDividends)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      {holdings.length > 0 && (
        <div className="rounded-md border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Current Holdings</h3>
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
                      {holding.quantity.toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      {formatCurrency(holding.averageCost)}
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
          <InvestmentTransactionTable
            accountId={id as string}
            title="Investment Transactions"
          />
        </div>
        <div className="w-full xl:w-80 shrink-0">
          <div className="p-4 border rounded-md">
            <h3 className="font-medium mb-2">Import Transactions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a CSV file to import your investment transactions
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
          accountType={AccountType.INVESTMENT}
          accountName={investmentAccount.account_name}
        />
      </div>
    </div>
  );
}
