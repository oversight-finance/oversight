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
import { AccountType } from "@/types/Account";

interface UserData {
  id: string;
  email?: string;
  created_at?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export default function SupabasePlayground() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountsWithTransactions, setAccountsWithTransactions] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>(AccountType.BANK);
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

  // // Function to fetch accounts with transactions
  // const fetchAccountsWithTransactions = async () => {
  //   setLoadingAccounts(true);
  //   setError(null);
    
  //   try {
  //     if (!userData?.id) {
  //       setError("User not authenticated");
  //       return;
  //     }
      
  //     const accounts = await fetchBankAccountsWithTransactions(userData.id);
  //     console.log(accounts);
  //     setAccountsWithTransactions(accounts);
  //   } catch (err) {
  //     console.error("Error fetching accounts with transactions:", err);
  //     setError(
  //       err instanceof Error ? err.message : "Failed to fetch accounts with transactions"
  //     );
  //   } finally {
  //     setLoadingAccounts(false);
  //   }
  // };

  // Define columns for the accounts table
  const accountColumns = [
    {
      header: "Account Name",
      accessorKey: "account_name"
    },
    {
      header: "Institution",
      accessorKey: "institution_name"
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
      cell: (value: any) => {
        // Mask account number for security
        return value ? `****${value.slice(-4)}` : "N/A";
      }
    }
  ];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Supabase Playground</h1>

      <Tabs defaultValue="user-info" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="user-info">User Info</TabsTrigger>
          <TabsTrigger value="accounts-with-transactions">Accounts With Transactions</TabsTrigger>
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

        <TabsContent value="accounts-with-transactions">
          <Card>
            <CardHeader>
              <CardTitle>Accounts With Transactions</CardTitle>
              <CardDescription>
                View your accounts with transactions using fetchUserAccountsWithTransactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <select 
                  className="p-2 border rounded-md"
                  value={selectedAccountType}
                  onChange={(e) => setSelectedAccountType(e.target.value as AccountType)}
                >
                  <option value={AccountType.BANK}>Bank Accounts</option>
                  <option value={AccountType.CREDIT}>Credit Accounts</option>
                  <option value={AccountType.SAVINGS}>Savings Accounts</option>
                  <option value={AccountType.INVESTMENT}>Investment Accounts</option>
                  <option value={AccountType.CRYPTO}>Crypto Wallets</option>
                </select>
                {/* <Button onClick={fetchAccountsWithTransactions} disabled={loadingAccounts}> */}
                  {/* {loadingAccounts ? "Loading..." : "Fetch Accounts"} */}
                {/* </Button> */}
              </div>

              {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-500 rounded-md">
                  {error}
                </div>
              )}

              {accountsWithTransactions.length > 0 ? (
                <div>
                  <h3 className="text-xl font-medium mb-4">Your {selectedAccountType} Accounts</h3>
                  <DataTable
                    data={accountsWithTransactions}
                    columns={accountColumns}
                    title={`${selectedAccountType} Accounts`}
                    // emptyMessage={`No ${selectedAccountType} accounts found`}
                  />
                  
                  <div className="mt-8">
                    <h3 className="text-xl font-medium mb-4">Raw Data</h3>
                    <pre className="bg-slate-50 p-4 rounded-md overflow-auto max-h-96">
                      {JSON.stringify(accountsWithTransactions, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 bg-slate-50 rounded-md">
                  <p>No accounts found. Please fetch accounts first.</p>
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
