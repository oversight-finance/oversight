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

export default function InvestmentPage({ params }: InvestmentPageProps) {
  redirect(`/accounts/investments/${params.id}`);
}
