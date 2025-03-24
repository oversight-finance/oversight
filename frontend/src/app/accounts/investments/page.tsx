import { Metadata } from "next";
import { fetchInvestmentAccounts } from "@/database/Investments";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { InvestmentAccount } from "@/types/Investment";
import NewInvestmentButton from "@/components/Assets/NewInvestmentButton";

export const metadata: Metadata = {
  title: "Investments | Oversight",
  description: "Manage your investment accounts",
};

export default async function InvestmentsPage() {
  // Check if user is logged in using server supabase
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login?redirectTo=/accounts/investments");
  }

  // Fetch user's investment accounts
  const accounts: InvestmentAccount[] = await fetchInvestmentAccounts(user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Investment Accounts</h1>
        <div className="flex justify-end mb-6">
          <NewInvestmentButton />
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">No Investment Accounts</h2>
          <p className="text-muted-foreground mb-8">Start tracking your investments by adding an account.</p>
          <NewInvestmentButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account: InvestmentAccount) => (
            <Link key={account.account_id} href={`/accounts/investments/${account.account_id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{account.institution}</CardTitle>
                  <p className="text-sm text-muted-foreground">{account.account_type}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="text-lg font-semibold">{formatCurrency(account.balance, account.currency)}</p>
                    </div>
                    {account.contribution_room !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Available Contribution Room</p>
                        <p className="font-medium">{formatCurrency(account.contribution_room, account.currency)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
