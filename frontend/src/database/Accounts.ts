import { createClient } from "@/utils/supabase/client";
import { Account, AccountType } from "@/types/Account";

// Type aliases for better readability
type AccountData = Omit<Account, "id" | "created_at" | "updated_at">;

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
export const fetchAccountsByIdsCore = async (
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
export const createAccountsCore = async (
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
export const updateAccountsCore = async (
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
export const deleteAccountsCore = async (
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
