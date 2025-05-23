import { createClient } from "@/utils/supabase/client";
import {
  Account,
  AccountType,
  InvestmentAccount,
  InvestmentAccountWithTransactions,
} from "@/types/Account";
import { createAccountsCore, deleteAccountsCore } from "./Accounts";
import { InvestmentTransaction } from "@/types";
import InvestmentTransactionTable from "@/components/TransactionTables/Investment/InvestmentTransactionTable";

// Type aliases for better readability
type InvestmentAccountData = Omit<InvestmentAccount, "account_id">;
export type CreateInvestmentAccount = Omit<
  InvestmentAccount,
  "account_id" | "id" | "user_id" | "created_at" | "updated_at"
>;

/**
 * Core implementation for fetching investment accounts by their account IDs
 * @param accountIds Array of account IDs to fetch investment accounts for
 * @returns Map of account IDs to investment accounts, or empty map if none found
 */
const fetchInvestmentAccountsCore = async (
  accountIds: string[]
): Promise<Map<string, InvestmentAccount>> => {
  if (!accountIds.length) return new Map();

  try {
    const supabase = createClient();
    const results = new Map<string, InvestmentAccount>();

    const { data, error } = await supabase
      .from("investment_accounts")
      .select("*")
      .in("account_id", accountIds);

    if (error) {
      console.error("Error fetching investment accounts:", error.message);
      return results;
    }

    // Map the results by account_id for easy lookup
    for (const investmentAccount of data) {
      results.set(
        investmentAccount.account_id,
        investmentAccount as InvestmentAccount
      );
    }

    return results;
  } catch (error) {
    console.error("Exception fetching investment accounts:", error);
    return new Map();
  }
};

/**
 * Fetches an investment account by its account_id
 * @param accountId The account_id of the investment account to fetch
 * @returns The investment account or null if not found
 */
export const fetchInvestmentAccount = async (
  accountId: string
): Promise<InvestmentAccount | null> => {
  if (!accountId) {
    console.error("No account ID provided to fetchInvestmentAccount");
    return null;
  }

  const results = await fetchInvestmentAccountsCore([accountId]);
  return results.get(accountId) || null;
};

/**
 * Fetches multiple investment accounts by their account IDs
 * @param accountIds Array of account IDs to fetch investment accounts for
 * @returns Map of account IDs to investment accounts
 */
export const fetchInvestmentAccounts = async (
  accountIds: string[]
): Promise<Map<string, InvestmentAccount>> => {
  return await fetchInvestmentAccountsCore(accountIds);
};

/**
 * Core implementation for creating investment accounts
 * @param userId The user ID who owns the accounts
 * @param investmentAccounts Array of investment account data to insert
 * @returns Array of created investment account IDs or null if creation failed
 */
const createInvestmentAccountsCore = async (
  userId: string,
  investmentAccounts: CreateInvestmentAccount[]
): Promise<string[] | null> => {
  if (!userId || !investmentAccounts.length) {
    console.error(
      "Missing user ID or investment accounts for createInvestmentAccountsCore"
    );
    return null;
  }

  try {
    const supabase = createClient();

    // Create base accounts first
    const baseAccounts = investmentAccounts.map((investmentAccount) => ({
      user_id: userId,
      account_name: investmentAccount.account_name,
      account_type: AccountType.INVESTMENT,
      balance: 0,
    }));

    const accountsResult = await createAccountsCore(baseAccounts);

    if (!accountsResult) {
      console.error("Error creating base accounts for investment accounts");
      return null;
    }

    // Now create the investment accounts
    const investmentAccountsToInsert = accountsResult.map(
      (account: Account, index: number) => ({
        account_id: account.id,
        investment_type: investmentAccounts[index].investment_type,
        institution: investmentAccounts[index].institution,
        account_number: investmentAccounts[index].account_number,
        contribution_room: investmentAccounts[index].contribution_room,
        currency: investmentAccounts[index].currency,
      })
    );

    const { error: investmentError } = await supabase
      .from("investment_accounts")
      .insert(investmentAccountsToInsert);

    if (investmentError) {
      console.error(
        "Error creating investment accounts:",
        investmentError.message
      );
      // Try to clean up the created accounts
      const accountIdsToDelete = accountsResult.map(
        (account: Account) => account.id
      );
      await deleteAccountsCore(accountIdsToDelete);
      return null;
    }

    // Create initial transactions for each account with the opening balance
    const initialTransactions = accountsResult
      .map((account: Account, index: number) => {
        const initialBalance = investmentAccounts[index].balance;
        if (initialBalance && initialBalance > 0) {
          return {
            account_id: account.id,
            transaction_date: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
            amount: initialBalance,
            transaction_type: "transfer",
            currency: investmentAccounts[index].currency,
            fee: 0,
            ticker_symbol: investmentAccounts[index].currency,
            price_per_unit: 1,
            quantity: initialBalance, 
          };
        }
        return null;
      })
      .filter(Boolean); // Remove null entries

    // Insert initial transactions if there are any
    if (initialTransactions.length > 0) {
      const { error: transactionError } = await supabase
        .from("investment_transactions")
        .insert(initialTransactions);

      if (transactionError) {
        console.error(
          "Error creating initial transactions:",
          transactionError.message
        );
        // We don't roll back the account creation if transaction creation fails
      }
    }

    return accountsResult.map((account: Account) => account.id);
  } catch (error) {
    console.error("Exception creating investment accounts:", error);
    return null;
  }
};

/**
 * Creates a new investment account along with its base account
 * @param userId The user ID who owns the account
 * @param investmentAccount The investment account data to insert
 * @returns The created investment account ID or null if creation failed
 */
export const createInvestmentAccount = async (
  userId: string,
  investmentAccount: CreateInvestmentAccount
): Promise<string | null> => {
  if (!userId) {
    console.error("No user ID provided to createInvestmentAccount");
    return null;
  }

  const results = await createInvestmentAccountsCore(userId, [
    investmentAccount,
  ]);
  // console.log("results", results);
  return results ? results[0] : null;
};

/**
 * Creates multiple investment accounts in a batch
 * @param userId The user ID who owns the accounts
 * @param investmentAccounts Array of investment account data to insert
 * @returns Array of created investment account IDs or null if creation failed
 */
export const createInvestmentAccountsBatch = async (
  userId: string,
  investmentAccounts: CreateInvestmentAccount[]
): Promise<string[] | null> => {
  return await createInvestmentAccountsCore(userId, investmentAccounts);
};

/**
 * Core implementation for updating investment accounts
 * @param accountIds Array of account IDs of the investment accounts to update
 * @param updates The updates to apply
 * @returns Map of account IDs to success/failure status
 */
const updateInvestmentAccountsCore = async (
  accountIds: string[],
  updates: Partial<InvestmentAccount>
): Promise<Map<string, boolean>> => {
  if (!accountIds.length) return new Map();

  const results = new Map<string, boolean>();

  try {
    const supabase = createClient();

    // Create a copy of updates to avoid modifying the original object
    const investmentUpdates = { ...updates };

    // Update all investment accounts in a batch
    const { error } = await supabase
      .from("investment_accounts")
      .update(investmentUpdates)
      .in("account_id", accountIds);

    if (error) {
      console.error("Error updating investment accounts:", error.message);
      // Set all as failed
      accountIds.forEach((id) => results.set(id, false));
      return results;
    }

    // Set all as successful
    accountIds.forEach((id) => results.set(id, true));
    return results;
  } catch (error) {
    console.error("Exception updating investment accounts:", error);
    // Set all as failed
    accountIds.forEach((id) => results.set(id, false));
    return results;
  }
};

/**
 * Updates an investment account
 * @param accountId The account_id of the investment account to update
 * @param updates The investment account fields to update
 * @returns True if successful, false otherwise
 */
export const updateInvestmentAccount = async (
  accountId: string,
  updates: Partial<InvestmentAccount>
): Promise<boolean> => {
  if (!accountId) {
    console.error("No account ID provided to updateInvestmentAccount");
    return false;
  }

  const results = await updateInvestmentAccountsCore([accountId], updates);
  return results.get(accountId) || false;
};

/**
 * Updates multiple investment accounts with the same updates
 * @param accountIds Array of account IDs of the investment accounts to update
 * @param updates The updates to apply to all investment accounts
 * @returns Map of account IDs to success/failure status
 */
export const updateInvestmentAccountsBatch = async (
  accountIds: string[],
  updates: Partial<InvestmentAccount>
): Promise<Map<string, boolean>> => {
  return await updateInvestmentAccountsCore(accountIds, updates);
};

/**
 * Fetches an investment account with its transactions
 * @param accountId The account_id of the investment account
 * @returns The investment account with transactions or null if not found
 */
export const fetchInvestmentAccountWithTransactions = async (
  accountId: string
): Promise<InvestmentAccountWithTransactions | null> => {
  if (!accountId) {
    console.error(
      "No account ID provided to fetchInvestmentAccountWithTransactions"
    );
    return null;
  }
  try {
    const supabase = createClient();

    // First, fetch the account data
    const { data, error } = await supabase
      .from("accounts")
      .select(
        `
        *,
        investment_accounts!inner(account_id, investment_type, institution, account_number, contribution_room, currency)
      `
      )
      .eq("id", accountId)
      .single();

    if (error) {
      console.error("Error fetching investment account:", error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    // Now fetch transactions separately
    const { data: transactionsData, error: transactionsError } = await supabase
      .from("investment_transactions")
      .select("*")
      .eq("account_id", accountId)
      .order("transaction_date", { ascending: false });

    if (transactionsError) {
      console.error(
        `Error fetching transactions for account ${accountId}:`,
        transactionsError.message
      );
      // Return account with empty transactions
      const { account_id, ...investmentAccountWithoutId } =
        data.investment_accounts;
      const { investment_accounts, ...accountWithoutInvestmentAccount } = data;

      return {
        ...accountWithoutInvestmentAccount,
        ...investmentAccountWithoutId,
        account_type: data.account_type as AccountType,
        transactions: [],
      };
    }

    // Restructure the data to match the expected InvestmentAccount format
    const { account_id, ...investmentAccountWithoutId } =
      data.investment_accounts;
    const { investment_accounts, ...accountWithoutInvestmentAccount } = data;

    const investmentAccount: InvestmentAccountWithTransactions = {
      ...accountWithoutInvestmentAccount,
      ...investmentAccountWithoutId,
      account_type: data.account_type as AccountType,
      transactions: transactionsData as InvestmentTransaction[],
    };

    return investmentAccount;
  } catch (error) {
    console.error(
      "Exception fetching investment account with transactions:",
      error
    );
    return null;
  }
};

/**
 * Fetches a list of investment accounts with their transactions
 * @param user_id The user_id of the owner of the investment accounts
 * @param dateRange Optional date range to filter transactions
 * @returns The investment accounts with their transactions or empty object if none found
 */
export const fetchInvestmentAccountsWithTransactions = async (
  user_id: string,
  dateRange?: { start: Date; end: Date }
): Promise<Record<string, InvestmentAccountWithTransactions>> => {
  const supabase = createClient();

  if (!user_id) {
    console.error(
      "No user ID provided to fetchInvestmentAccountsWithTransactions"
    );
    return {};
  }

  try {
    // First, fetch all investment accounts for the user
    const { data: accountsData, error: accountsError } = await supabase
      .from("accounts")
      .select(
        `
        *,
        investment_accounts!inner(account_id, investment_type, institution, account_number, contribution_room, currency)
        `
      )
      .eq("user_id", user_id)
      .eq("account_type", AccountType.INVESTMENT);

    if (accountsError) {
      console.error(
        "Error fetching investment accounts:",
        accountsError.message
      );
      return {};
    }

    if (!accountsData || accountsData.length === 0) {
      return {};
    }

    // For each account, fetch its transactions and combine the data
    const accountsWithTransactions = await Promise.all(
      accountsData.map(async (account) => {
        // Start building the query
        let transactionsQuery = supabase
          .from("investment_transactions")
          .select("*")
          .eq("account_id", account.id);

        // Apply date range filter if provided
        if (dateRange) {
          transactionsQuery = transactionsQuery
            .gte("transaction_date", dateRange.start.toISOString())
            .lte("transaction_date", dateRange.end.toISOString());
        }

        // Execute the query with ordering
        const { data: transactionsData, error: transactionsError } =
          await transactionsQuery.order("transaction_date", {
            ascending: false,
          });

        const { account_id, ...investmentAccountWithoutId } =
          account.investment_accounts;
        const { investment_accounts, ...accountWithoutInvestmentAccount } =
          account;

        if (transactionsError) {
          console.error(
            `Error fetching transactions for account ${account.id}:`,
            transactionsError.message
          );

          // If there's an error fetching transactions, we'll still return the account
          // but with an empty transactions array
          return {
            ...accountWithoutInvestmentAccount,
            ...investmentAccountWithoutId,
            account_type: account.account_type as AccountType,
            transactions: [],
          };
        }

        // Combine account data with transactions
        return {
          ...accountWithoutInvestmentAccount,
          ...investmentAccountWithoutId,
          account_type: account.account_type as AccountType,
          transactions: transactionsData as InvestmentTransaction[],
        };
      })
    );

    // Convert array to Record<string, InvestmentAccountWithTransactions>
    const accountsRecord: Record<string, InvestmentAccountWithTransactions> =
      {};
    for (const account of accountsWithTransactions) {
      accountsRecord[account.id] = account as InvestmentAccountWithTransactions;
    }

    return accountsRecord;
  } catch (error) {
    console.error(
      "Exception fetching investment accounts with transactions:",
      error
    );
    return {};
  }
};
