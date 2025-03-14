import { createClient } from "@/utils/supabase/client";
import {
  Account,
  AccountType,
  BankAccount,
  BankAccountWithTransactions,
} from "@/types/Account";
import { BankAccountTransaction } from "@/types/BankAccountTransaction";

// Type aliases for better readability
type AccountData = Omit<Account, "id" | "created_at" | "updated_at">;
type BankAccountData = Omit<BankAccount, "account_id">;

/**
 * Fetches all accounts for a user
 * @param userId The ID of the user whose accounts to fetch
 * @returns Array of accounts or empty array if none found
 */
export const fetchUserAccounts = async (userId: string): Promise<Account[]> => {
  if (!userId) {
    console.error("No user ID provided to fetchUserAccounts");
    return [];
  }

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user accounts:", error.message);
      return [];
    }

    return data as Account[];
  } catch (error) {
    console.error("Exception fetching user accounts:", error);
    return [];
  }
};

/**
 * Core implementation for fetching accounts by their IDs
 * @param accountIds Array of account IDs to fetch
 * @returns Map of account IDs to accounts, or empty map if none found
 */
const fetchAccountsByIdsCore = async (
  accountIds: string[]
): Promise<Map<string, Account>> => {
  if (!accountIds.length) return new Map();

  try {
    const supabase = createClient();
    const results = new Map<string, Account>();

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .in("id", accountIds);

    if (error) {
      console.error("Error fetching accounts by IDs:", error.message);
      return results;
    }

    // Map the results by ID for easy lookup
    for (const account of data) {
      results.set(account.id, account as Account);
    }

    return results;
  } catch (error) {
    console.error("Exception fetching accounts by IDs:", error);
    return new Map();
  }
};

/**
 * Fetches a specific account by ID
 * @param accountId The ID of the account to fetch
 * @returns The account or null if not found
 */
export const fetchAccountById = async (
  accountId: string
): Promise<Account | null> => {
  if (!accountId) {
    console.error("No account ID provided to fetchAccountById");
    return null;
  }

  const results = await fetchAccountsByIdsCore([accountId]);
  return results.get(accountId) || null;
};

/**
 * Fetches multiple accounts by their IDs
 * @param accountIds Array of account IDs to fetch
 * @returns Map of account IDs to accounts
 */
export const fetchAccountsByIds = async (
  accountIds: string[]
): Promise<Map<string, Account>> => {
  return await fetchAccountsByIdsCore(accountIds);
};

/**
 * Core implementation for creating accounts
 * @param accounts Array of account data to insert
 * @returns Array of created accounts or null if creation failed
 */
const createAccountsCore = async (
  accounts: AccountData[]
): Promise<Account[] | null> => {
  if (!accounts.length) return null;

  try {
    const supabase = createClient();
    const now = new Date().toISOString();

    // Prepare accounts with timestamps
    const preparedAccounts = accounts.map((account) => ({
      ...account,
      created_at: now,
      updated_at: now,
    }));

    // Insert all accounts in a batch
    const { data, error } = await supabase
      .from("accounts")
      .insert(preparedAccounts)
      .select();

    if (error) {
      console.error("Error creating accounts:", error.message);
      return null;
    }

    return data as Account[];
  } catch (error) {
    console.error("Exception creating accounts:", error);
    return null;
  }
};

/**
 * Creates a new account
 * @param account The account data to insert
 * @returns The created account or null if creation failed
 */
export const createAccount = async (
  account: AccountData
): Promise<Account | null> => {
  const results = await createAccountsCore([account]);
  return results ? results[0] : null;
};

/**
 * Creates multiple accounts in a batch
 * @param accounts Array of account data to insert
 * @returns Array of created accounts or null if creation failed
 */
export const createAccountsBatch = async (
  accounts: AccountData[]
): Promise<Account[] | null> => {
  return await createAccountsCore(accounts);
};

/**
 * Core implementation for updating accounts
 * @param accountIds Array of account IDs to update
 * @param updates The updates to apply
 * @returns Map of account IDs to success/failure status
 */
const updateAccountsCore = async (
  accountIds: string[],
  updates: Partial<Omit<Account, "id" | "created_at">>
): Promise<Map<string, boolean>> => {
  if (!accountIds.length) return new Map();

  const results = new Map<string, boolean>();

  try {
    const supabase = createClient();

    // Add updated_at timestamp to the updates
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Update all accounts in a batch
    const { error } = await supabase
      .from("accounts")
      .update(updatedData)
      .in("id", accountIds);

    if (error) {
      console.error("Error updating accounts:", error.message);
      // Set all as failed
      accountIds.forEach((id) => results.set(id, false));
      return results;
    }

    // Set all as successful
    accountIds.forEach((id) => results.set(id, true));
    return results;
  } catch (error) {
    console.error("Exception updating accounts:", error);
    // Set all as failed
    accountIds.forEach((id) => results.set(id, false));
    return results;
  }
};

/**
 * Updates an existing account
 * @param accountId The ID of the account to update
 * @param updates The account fields to update
 * @returns True if successful, false otherwise
 */
export const updateAccount = async (
  accountId: string,
  updates: Partial<Omit<Account, "id" | "created_at">>
): Promise<boolean> => {
  if (!accountId) {
    console.error("No account ID provided to updateAccount");
    return false;
  }

  const results = await updateAccountsCore([accountId], updates);
  return results.get(accountId) || false;
};

/**
 * Updates multiple accounts with the same updates
 * @param accountIds Array of account IDs to update
 * @param updates The updates to apply to all accounts
 * @returns Map of account IDs to success/failure status
 */
export const updateAccountsBatch = async (
  accountIds: string[],
  updates: Partial<Omit<Account, "id" | "created_at">>
): Promise<Map<string, boolean>> => {
  return await updateAccountsCore(accountIds, updates);
};

/**
 * Core implementation for deleting accounts
 * @param accountIds Array of account IDs to delete
 * @returns Map of account IDs to success/failure status
 */
const deleteAccountsCore = async (
  accountIds: string[]
): Promise<Map<string, boolean>> => {
  if (!accountIds.length) return new Map();

  const results = new Map<string, boolean>();

  try {
    const supabase = createClient();

    // Delete all accounts in a batch
    const { error } = await supabase
      .from("accounts")
      .delete()
      .in("id", accountIds);

    if (error) {
      console.error("Error deleting accounts:", error.message);
      // Set all as failed
      accountIds.forEach((id) => results.set(id, false));
      return results;
    }

    // Set all as successful
    accountIds.forEach((id) => results.set(id, true));
    return results;
  } catch (error) {
    console.error("Exception deleting accounts:", error);
    // Set all as failed
    accountIds.forEach((id) => results.set(id, false));
    return results;
  }
};

/**
 * Deletes an account
 * @param accountId The ID of the account to delete
 * @returns True if successful, false otherwise
 */
export const deleteAccount = async (accountId: string): Promise<boolean> => {
  if (!accountId) {
    console.error("No account ID provided to deleteAccount");
    return false;
  }

  const results = await deleteAccountsCore([accountId]);
  return results.get(accountId) || false;
};

/**
 * Deletes multiple accounts
 * @param accountIds Array of account IDs to delete
 * @returns Map of account IDs to success/failure status
 */
export const deleteAccountsBatch = async (
  accountIds: string[]
): Promise<Map<string, boolean>> => {
  return await deleteAccountsCore(accountIds);
};

// Bank Account operations

/**
 * Core implementation for fetching bank accounts by their account IDs
 * @param accountIds Array of account IDs to fetch bank accounts for
 * @returns Map of account IDs to bank accounts, or empty map if none found
 */
const fetchBankAccountsCore = async (
  accountIds: string[]
): Promise<Map<string, BankAccount>> => {
  if (!accountIds.length) return new Map();

  try {
    const supabase = createClient();
    const results = new Map<string, BankAccount>();

    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .in("account_id", accountIds);

    if (error) {
      console.error("Error fetching bank accounts:", error.message);
      return results;
    }

    // Map the results by account_id for easy lookup
    for (const bankAccount of data) {
      results.set(bankAccount.account_id, bankAccount as BankAccount);
    }

    return results;
  } catch (error) {
    console.error("Exception fetching bank accounts:", error);
    return new Map();
  }
};

/**
 * Fetches a bank account by its account_id
 * @param accountId The account_id of the bank account to fetch
 * @returns The bank account or null if not found
 */
export const fetchBankAccount = async (
  accountId: string
): Promise<BankAccount | null> => {
  if (!accountId) {
    console.error("No account ID provided to fetchBankAccount");
    return null;
  }

  const results = await fetchBankAccountsCore([accountId]);
  return results.get(accountId) || null;
};

/**
 * Fetches multiple bank accounts by their account IDs
 * @param accountIds Array of account IDs to fetch bank accounts for
 * @returns Map of account IDs to bank accounts
 */
export const fetchBankAccounts = async (
  accountIds: string[]
): Promise<Map<string, BankAccount>> => {
  return await fetchBankAccountsCore(accountIds);
};

/**
 * Core implementation for creating bank accounts
 * @param userId The user ID who owns the accounts
 * @param bankAccounts Array of bank account data to insert
 * @returns Array of created bank account IDs or null if creation failed
 */
const createBankAccountsCore = async (
  userId: string,
  bankAccounts: BankAccountData[]
): Promise<string[] | null> => {
  if (!userId || !bankAccounts.length) {
    console.error(
      "Missing user ID or bank accounts for createBankAccountsCore"
    );
    return null;
  }

  try {
    const supabase = createClient();

    // Create base accounts first
    const baseAccounts = bankAccounts.map((bankAccount) => ({
      user_id: userId,
      account_type: AccountType.BANK,
      balance: bankAccount.balance, // Keep the balance as provided, don't modify it
    }));

    const accountsResult = await createAccountsCore(baseAccounts);

    if (!accountsResult) {
      console.error("Error creating base accounts for bank accounts");
      return null;
    }

    // Now create the bank accounts
    const bankAccountsToInsert = accountsResult.map(
      (account: Account, index: number) => ({
        account_id: account.id,
        account_name: bankAccounts[index].account_name,
        institution_name: bankAccounts[index].institution_name,
        account_number: bankAccounts[index].account_number,
        routing_number: bankAccounts[index].routing_number,
        currency: bankAccounts[index].currency,
        balance: bankAccounts[index].balance, // Keep the balance as provided, don't modify it
      })
    );

    const { error: bankError } = await supabase
      .from("bank_accounts")
      .insert(bankAccountsToInsert);

    if (bankError) {
      console.error("Error creating bank accounts:", bankError.message);
      // Try to clean up the created accounts
      const accountIdsToDelete = accountsResult.map(
        (account: Account) => account.id
      );
      await deleteAccountsCore(accountIdsToDelete);
      return null;
    }

    return accountsResult.map((account: Account) => account.id);
  } catch (error) {
    console.error("Exception creating bank accounts:", error);
    return null;
  }
};

/**
 * Creates a new bank account along with its base account
 * @param userId The user ID who owns the account
 * @param bankAccount The bank account data to insert
 * @returns The created bank account ID or null if creation failed
 */
export const createBankAccount = async (
  userId: string,
  bankAccount: BankAccountData
): Promise<string | null> => {
  if (!userId) {
    console.error("No user ID provided to createBankAccount");
    return null;
  }

  const results = await createBankAccountsCore(userId, [bankAccount]);
  return results ? results[0] : null;
};

/**
 * Creates multiple bank accounts in a batch
 * @param userId The user ID who owns the accounts
 * @param bankAccounts Array of bank account data to insert
 * @returns Array of created bank account IDs or null if creation failed
 */
export const createBankAccountsBatch = async (
  userId: string,
  bankAccounts: BankAccountData[]
): Promise<string[] | null> => {
  return await createBankAccountsCore(userId, bankAccounts);
};

/**
 * Core implementation for updating bank accounts
 * @param accountIds Array of account IDs of the bank accounts to update
 * @param updates The updates to apply
 * @returns Map of account IDs to success/failure status
 */
const updateBankAccountsCore = async (
  accountIds: string[],
  updates: Partial<BankAccount>
): Promise<Map<string, boolean>> => {
  if (!accountIds.length) return new Map();

  const results = new Map<string, boolean>();

  try {
    const supabase = createClient();

    // Create a copy of updates to avoid modifying the original object
    const bankUpdates = { ...updates };

    // Update all bank accounts in a batch
    const { error } = await supabase
      .from("bank_accounts")
      .update(bankUpdates)
      .in("account_id", accountIds);

    if (error) {
      console.error("Error updating bank accounts:", error.message);
      // Set all as failed
      accountIds.forEach((id) => results.set(id, false));
      return results;
    }

    // Set all as successful
    accountIds.forEach((id) => results.set(id, true));
    return results;
  } catch (error) {
    console.error("Exception updating bank accounts:", error);
    // Set all as failed
    accountIds.forEach((id) => results.set(id, false));
    return results;
  }
};

/**
 * Updates a bank account
 * @param accountId The account_id of the bank account to update
 * @param updates The bank account fields to update
 * @returns True if successful, false otherwise
 */
export const updateBankAccount = async (
  accountId: string,
  updates: Partial<BankAccount>
): Promise<boolean> => {
  if (!accountId) {
    console.error("No account ID provided to updateBankAccount");
    return false;
  }

  const results = await updateBankAccountsCore([accountId], updates);
  return results.get(accountId) || false;
};

/**
 * Updates multiple bank accounts with the same updates
 * @param accountIds Array of account IDs of the bank accounts to update
 * @param updates The updates to apply to all bank accounts
 * @returns Map of account IDs to success/failure status
 */
export const updateBankAccountsBatch = async (
  accountIds: string[],
  updates: Partial<BankAccount>
): Promise<Map<string, boolean>> => {
  return await updateBankAccountsCore(accountIds, updates);
};

/**
 * Fetches a bank account with its transactions
 * @param accountId The account_id of the bank account
 * @returns The bank account with transactions or null if not found
 */
export const fetchBankAccountWithTransactions = async (
  accountId: string
): Promise<BankAccountWithTransactions | null> => {
  if (!accountId) {
    console.error("No account ID provided to fetchBankAccountWithTransactions");
    return null;
  }
  try {
    const supabase = createClient();

    // Fetch the account and its transactions in a single query with a join
    const { data, error } = await supabase
      .from("accounts")
      .select(
        `
        *,
        bank_accounts!inner(account_id, account_name, institution_name, account_number, routing_number, currency, balance),
        bank_accounts_transactions(*)
      `
      )
      .eq("id", accountId)
      .order("bank_accounts_transactions.transaction_date", {
        ascending: false,
      })
      .single();

    if (error) {
      console.error(
        "Error fetching bank account with transactions:",
        error.message
      );
      return null;
    }

    if (!data) {
      return null;
    }

    // Restructure the data to match the expected BankAccountWithTransactions format
    const bankAccount: BankAccountWithTransactions = {
      ...data,
      account_type: data.account_type as AccountType,
      transactions: data.bank_accounts_transactions as BankAccountTransaction[],
    };

    return bankAccount;
  } catch (error) {
    console.error("Exception fetching bank account with transactions:", error);
    return null;
  }
};

/**
 * Placeholder function for compatibility with existing code
 * This function is a no-op as balance synchronization is now handled elsewhere
 * @returns Always returns true for backwards compatibility
 */
export const syncAccountBalance = async (): Promise<boolean> => {
  // This is a no-op placeholder function for backwards compatibility
  return true;
};

/**
 * Placeholder function for compatibility with existing code
 * This function is a no-op as balance synchronization is now handled elsewhere
 * @param accountIds Array of account IDs
 * @returns Map with all IDs set to true for backwards compatibility
 */
export const syncAccountBalancesBatch = async (
  accountIds: string[]
): Promise<Map<string, boolean>> => {
  // This is a no-op placeholder function for backwards compatibility
  const results = new Map<string, boolean>();
  accountIds.forEach((id) => results.set(id, true));
  return results;
};
