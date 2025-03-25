import { createClient } from "@/utils/supabase/server";
import { InvestmentAccount, InvestmentAccountWithTransactions } from "@/types/Investment";
import { AccountType } from "@/types/Account";

/**
 * Fetches all investment accounts for a user
 */
export async function fetchInvestmentAccounts(userId: string): Promise<InvestmentAccount[]> {
  if (!userId) return [];

  try {
    const supabase = await createClient();

    // First get all account IDs that are investment type
    const { data: accounts, error: accountsError } = await supabase.from("accounts").select("id").eq("user_id", userId).eq("account_type", AccountType.INVESTMENT);

    if (accountsError || !accounts.length) return [];

    const accountIds = accounts.map((account) => account.id);

    // Then get the investment accounts with those IDs
    const { data, error } = await supabase.from("investment_accounts").select("*").in("account_id", accountIds);

    if (error) {
      console.error("Error fetching investment accounts:", error);
      return [];
    }

    return data as InvestmentAccount[];
  } catch (error) {
    console.error("Exception fetching investment accounts:", error);
    return [];
  }
}

/**
 * Fetches a single investment account with its transactions
 */
export async function fetchInvestmentAccountWithTransactions(accountId: string): Promise<InvestmentAccountWithTransactions | null> {
  if (!accountId) return null;

  try {
    const supabase = await createClient();

    // First get the investment account
    const { data: account, error: accountError } = await supabase.from("investment_accounts").select("*").eq("account_id", accountId).single();

    if (accountError || !account) {
      console.error("Error fetching investment account:", accountError);
      return null;
    }

    // Then get its transactions
    const { data: transactions, error: transactionsError } = await supabase.from("investment_transactions").select("*").eq("account_id", accountId).order("transaction_date", { ascending: false });

    if (transactionsError) {
      console.error("Error fetching investment transactions:", transactionsError);
      return null;
    }

    return {
      ...account,
      transactions: transactions || [],
    } as InvestmentAccountWithTransactions;
  } catch (error) {
    console.error("Exception fetching investment account with transactions:", error);
    return null;
  }
}
