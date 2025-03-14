"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/DataTable/DataTable";
import { useAccounts } from "@/contexts/AccountsContext";
import { fetchBankAccountWithTransactions } from "@/database/Accounts";
import { toUITransactions } from "@/types/Transaction";
import { BankAccountTransaction } from "@/types/BankAccountTransaction";

interface UserData {
  id: string;
  email?: string;
  created_at?: string;
  [key: string]: string | number | boolean | null;
}

export default function SupabasePlayground() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankAccountsWithTransactions, setBankAccountsWithTransactions] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const { accounts } = useAccounts();

  // Function to fetch the current user's data
  const fetchUserData = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError("No authenticated user found");
        setUserData(null);
        return;
      }

      // Get additional user profile data from your database if you have a profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Profile fetch error:", profileError);
      }

      // Combine auth user data with profile data if available
      const combinedUserData = {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
        ...(profileData || {}),
      };

      setUserData(combinedUserData);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch user data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch bank accounts with transactions
  const fetchBankAccounts = async () => {
    setLoadingAccounts(true);
    try {
      if (!accounts || accounts.length === 0) {
        return;
      }

      // Filter for bank accounts only
      const bankAccountIds = accounts
        .filter(account => account.account_type === 'bank')
        .map(account => account.id);

      if (bankAccountIds.length === 0) {
        return;
      }

      // Fetch each bank account with its transactions
      const accountsWithTransactionsPromises = bankAccountIds.map(
        async (accountId) => {
          const accountWithTransactions = await fetchBankAccountWithTransactions(accountId);
          if (accountWithTransactions) {
            // Convert transactions to UI format
            const uiTransactions = toUITransactions(accountWithTransactions.transactions);
            return {
              ...accountWithTransactions,
              uiTransactions
            };
          }
          return null;
        }
      );

      const results = await Promise.all(accountsWithTransactionsPromises);
      setBankAccountsWithTransactions(results.filter(Boolean));
    } catch (err) {
      console.error("Error fetching bank accounts:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch bank accounts"
      );
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Fetch bank accounts when accounts context changes
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      fetchBankAccounts();
    }
  }, [accounts]);

  // Define columns for the accounts table
  const accountColumns = [
    {
      header: "Account Name",
      accessorKey: "account_name",
      cell: (value: any, row: any) => {
        const bankAccount = row.bank_accounts?.[0];
        return bankAccount?.account_name || "N/A";
      }
    },
    {
      header: "Institution",
      accessorKey: "institution_name",
      cell: (value: any, row: any) => {
        console.log("row", row);
        const bankAccount = row.bank_accounts?.[0];
        return bankAccount?.institution_name || "N/A";
      }
    },
    {
      header: "Balance",
      accessorKey: "balance",
      type: "currency",
      cell: (value: any) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value || 0);
      }
    },
    {
      header: "Account Number",
      accessorKey: "account_number",
      cell: (value: any, row: any) => {
        const bankAccount = row.bank_accounts?.[0];
        const accountNumber = bankAccount?.account_number || "";
        // Mask account number for security
        return accountNumber ? `****${accountNumber.slice(-4)}` : "N/A";
      }
    }
  ];

  // Define columns for the transactions table
  const transactionColumns = [
    {
      header: "Date",
      accessorKey: "date",
      type: "date",
      cell: (value: any) => {
        return value ? new Date(value).toLocaleDateString() : "N/A";
      }
    },
    {
      header: "Merchant",
      accessorKey: "merchant"
    },
    {
      header: "Category",
      accessorKey: "category"
    },
    {
      header: "Amount",
      accessorKey: "amount",
      type: "currency",
      cell: (value: any) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value || 0);
      }
    }
  ];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Supabase Playground</h1>

      <Tabs defaultValue="user-info" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="user-info">User Info</TabsTrigger>
          <TabsTrigger value="bank-accounts">Bank Accounts</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
        </TabsList>

        <TabsContent value="user-info">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                Test retrieving user information from Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Button onClick={fetchUserData} disabled={loading}>
                  {loading ? "Loading..." : "Fetch Current User"}
                </Button>
              </div>

              {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-500 rounded-md">
                  {error}
                </div>
              )}

              {userData && (
                <div>
                  <h3 className="text-xl font-medium mb-2">User Data</h3>
                  <Separator className="my-4" />
                  <pre className="bg-slate-50 p-4 rounded-md overflow-auto max-h-96">
                    {JSON.stringify(userData, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank-accounts">
          <Card>
            <CardHeader>
              <CardTitle>Bank Accounts</CardTitle>
              <CardDescription>
                View your bank accounts and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Button onClick={fetchBankAccounts} disabled={loadingAccounts}>
                  {loadingAccounts ? "Loading..." : "Refresh Accounts"}
                </Button>
              </div>

              {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-500 rounded-md">
                  {error}
                </div>
              )}

              {accounts && accounts.length > 0 ? (
                <div>
                  <h3 className="text-xl font-medium mb-4">Your Bank Accounts</h3>
                  <DataTable<BankAccountTransaction>
                    data={accounts.filter(account => account.account_type === 'bank')}
                    columns={accountColumns}
                    title="Bank Accounts"
                    showActions={false}
                    emptyMessage="No bank accounts found"
                  />
                  
                  {bankAccountsWithTransactions.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-xl font-medium mb-4">Recent Transactions</h3>
                      {bankAccountsWithTransactions.map((account, index) => (
                        <div key={account.id} className="mb-8">
                          <h4 className="text-lg font-medium mb-2">
                            {account.bank_accounts?.[0]?.account_name || `Account ${index + 1}`}
                          </h4>
                          <DataTable
                            data={account.uiTransactions || []}
                            columns={transactionColumns}
                            title={`Transactions`}
                            showActions={false}
                            emptyMessage="No transactions found"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 bg-slate-50 rounded-md">
                  <p>No bank accounts found. Please add an account first.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Storage Operations</CardTitle>
              <CardDescription>
                Test Supabase storage operations here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Add storage test functionality here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="functions">
          <Card>
            <CardHeader>
              <CardTitle>Edge Functions</CardTitle>
              <CardDescription>
                Test Supabase Edge Functions here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Add edge function test functionality here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
