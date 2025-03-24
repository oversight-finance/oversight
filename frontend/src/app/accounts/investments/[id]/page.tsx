import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { fetchInvestmentAccountWithTransactions } from "@/database/Investments";
import InvestmentDetails from "@/components/Assets/InvestmentDetails";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import InvestmentTransactionTable from "@/components/TransactionTables/Investment/InvestmentTransactionTable";
import { InvestmentTransaction } from "@/types/Investment";

// Create a client component wrapper to handle passing the accountId
const AddTransactionWrapper = dynamic(() => import("@/components/Assets/AddTransactionWrapper"), { ssr: false });

export const metadata: Metadata = {
  title: "Investment Details | Oversight",
  description: "View investment account details",
};

interface InvestmentPageProps {
  params: {
    id: string;
  };
}

export default async function InvestmentPage({ params }: InvestmentPageProps) {
  // Check if user is logged in using server supabase
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login?redirectTo=/accounts/investments/" + params.id);
  }

  // Fetch investment account with transactions
  const account = await fetchInvestmentAccountWithTransactions(params.id);

  if (!account) {
    redirect("/accounts/investments");
  }

  // Use transactions from the fetched account data
  const transactions = account.transactions || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">{account.institution}</h1>
          <p className="text-muted-foreground">{account.account_type}</p>
        </div>
        <div className="flex gap-4">
          <AddTransactionWrapper accountId={params.id} />
        </div>
      </div>

      <InvestmentDetails account={account} />

      <InvestmentTransactionTable transactions={transactions} title="Investment Account Transactions" />
    </div>
  );
}
