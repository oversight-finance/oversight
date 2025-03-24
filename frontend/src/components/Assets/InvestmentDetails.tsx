"use client";

import { InvestmentAccountWithTransactions } from "@/types/Investment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface InvestmentDetailsProps {
  account: InvestmentAccountWithTransactions;
}

// Helper function to format dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

export default function InvestmentDetails({ account }: InvestmentDetailsProps) {
  // Calculate performance metrics
  const totalContributions = account.transactions.filter((t) => t.transaction_type === "contribution").reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = account.transactions.filter((t) => t.transaction_type === "withdrawal").reduce((sum, t) => sum + t.amount, 0);

  const netInvestment = totalContributions - totalWithdrawals;
  const roi = netInvestment !== 0 ? ((account.balance - netInvestment) / netInvestment) * 100 : 0;

  // Prepare chart data
  const chartData = account.transactions
    .filter((t) => t.transaction_type === "contribution" || t.transaction_type === "withdrawal")
    .map((t) => ({
      date: formatDate(t.transaction_date),
      amount: t.transaction_type === "contribution" ? t.amount : -t.amount,
    }))
    .reverse();

  return (
    <div className="space-y-6">
      {/* First row: Account Info and Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Account Type</p>
              <p className="font-medium">{account.account_type}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Institution</p>
              <p className="font-medium">{account.institution}</p>
            </div>

            {account.account_number && (
              <div>
                <p className="text-sm text-muted-foreground">Account Number</p>
                <p className="font-medium">{account.account_number}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="font-medium">{formatCurrency(account.balance, account.currency)}</p>
            </div>

            {account.contribution_room !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Available Contribution Room</p>
                <p className="font-medium">{formatCurrency(account.contribution_room, account.currency)}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="font-medium">{account.currency}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Contributions</p>
              <p className="font-medium">{formatCurrency(totalContributions, account.currency)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Total Withdrawals</p>
              <p className="font-medium">{formatCurrency(totalWithdrawals, account.currency)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Net Investment</p>
              <p className="font-medium">{formatCurrency(netInvestment, account.currency)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Return on Investment</p>
              <p className="font-medium">{roi.toFixed(2)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row: Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cash Flow History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value), account.currency)} />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Amount" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Third row: Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {account.transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                  <TableCell className="capitalize">{transaction.transaction_type.replace("_", " ")}</TableCell>
                  <TableCell>{transaction.ticker_symbol || "-"}</TableCell>
                  <TableCell>{transaction.quantity?.toFixed(6) || "-"}</TableCell>
                  <TableCell>{transaction.price_per_unit ? formatCurrency(transaction.price_per_unit, transaction.currency) : "-"}</TableCell>
                  <TableCell>{transaction.fee ? formatCurrency(transaction.fee, transaction.currency) : "-"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(transaction.amount, transaction.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
