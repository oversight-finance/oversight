import { createClient } from "@/utils/supabase/client";
import { Account, AccountType, CryptoWallet } from "@/types/Account";
import { createAccountsCore, deleteAccountsCore } from "./Accounts";
import { CryptoWalletTransaction } from "@/types";

// Type aliases for better readability
type CryptoWalletData = Omit<CryptoWallet, "account_id">;
export type CreateCryptoWallet = Omit<
  CryptoWallet,
  "account_id" | "id" | "user_id" | "created_at" | "updated_at"
>;

/**
 * Core implementation for fetching crypto wallets by their account IDs
 * @param accountIds Array of account IDs to fetch crypto wallets for
 * @returns Map of account IDs to crypto wallets, or empty map if none found
 */
const fetchCryptoWalletsCore = async (
  accountIds: string[]
): Promise<Map<string, CryptoWallet>> => {
  if (!accountIds.length) return new Map();

  try {
    const supabase = createClient();
    const results = new Map<string, CryptoWallet>();

    const { data, error } = await supabase
      .from("crypto_wallets")
      .select("*")
      .in("account_id", accountIds);

    if (error) {
      console.error("Error fetching crypto wallets:", error.message);
      return results;
    }

    // Map the results by account_id for easy lookup
    for (const cryptoWallet of data) {
      results.set(cryptoWallet.account_id, cryptoWallet as CryptoWallet);
    }

    return results;
  } catch (error) {
    console.error("Exception fetching crypto wallets:", error);
    return new Map();
  }
};

/**
 * Fetches a crypto wallet by its account_id
 * @param accountId The account_id of the crypto wallet to fetch
 * @returns The crypto wallet or null if not found
 */
export const fetchCryptoWallet = async (
  accountId: string
): Promise<CryptoWallet | null> => {
  if (!accountId) {
    console.error("No account ID provided to fetchCryptoWallet");
    return null;
  }

  const results = await fetchCryptoWalletsCore([accountId]);
  return results.get(accountId) || null;
};

/**
 * Fetches multiple crypto wallets by their account IDs
 * @param accountIds Array of account IDs to fetch crypto wallets for
 * @returns Map of account IDs to crypto wallets
 */
export const fetchCryptoWallets = async (
  accountIds: string[]
): Promise<Map<string, CryptoWallet>> => {
  return await fetchCryptoWalletsCore(accountIds);
};

/**
 * Core implementation for creating crypto wallets
 * @param userId The user ID who owns the accounts
 * @param cryptoWallets Array of crypto wallet data to insert
 * @returns Array of created crypto wallet IDs or null if creation failed
 */
const createCryptoWalletsCore = async (
  userId: string,
  cryptoWallets: CreateCryptoWallet[]
): Promise<string[] | null> => {
  if (!userId || !cryptoWallets.length) {
    console.error(
      "Missing user ID or crypto wallets for createCryptoWalletsCore"
    );
    return null;
  }

  try {
    const supabase = createClient();

    // Create base accounts first
    const baseAccounts = cryptoWallets.map((cryptoWallet) => ({
      user_id: userId,
      account_name: cryptoWallet.account_name,
      account_type: AccountType.CRYPTO,
      balance: cryptoWallet.balance,
    }));

    const accountsResult = await createAccountsCore(baseAccounts);

    if (!accountsResult) {
      console.error("Error creating base accounts for crypto wallets");
      return null;
    }

    // Now create the crypto wallets
    const cryptoWalletsToInsert = accountsResult.map(
      (account: Account, index: number) => ({
        account_id: account.id,
        wallet_address: cryptoWallets[index].wallet_address,
        balance: cryptoWallets[index].balance,
        coin_symbol: cryptoWallets[index].coin_symbol,
      })
    );

    const { error: cryptoError } = await supabase
      .from("crypto_wallets")
      .insert(cryptoWalletsToInsert);

    if (cryptoError) {
      console.error("Error creating crypto wallets:", cryptoError.message);
      // Try to clean up the created accounts
      const accountIdsToDelete = accountsResult.map(
        (account: Account) => account.id
      );
      await deleteAccountsCore(accountIdsToDelete);
      return null;
    }

    return accountsResult.map((account: Account) => account.id);
  } catch (error) {
    console.error("Exception creating crypto wallets:", error);
    return null;
  }
};

/**
 * Creates a new crypto wallet along with its base account
 * @param userId The user ID who owns the account
 * @param cryptoWallet The crypto wallet data to insert
 * @returns The created crypto wallet ID or null if creation failed
 */
export const createCryptoWallet = async (
  userId: string,
  cryptoWallet: CreateCryptoWallet
): Promise<string | null> => {
  if (!userId) {
    console.error("No user ID provided to createCryptoWallet");
    return null;
  }

  const results = await createCryptoWalletsCore(userId, [cryptoWallet]);
  return results ? results[0] : null;
};

/**
 * Creates multiple crypto wallets in a batch
 * @param userId The user ID who owns the accounts
 * @param cryptoWallets Array of crypto wallet data to insert
 * @returns Array of created crypto wallet IDs or null if creation failed
 */
export const createCryptoWalletsBatch = async (
  userId: string,
  cryptoWallets: CryptoWalletData[]
): Promise<string[] | null> => {
  return await createCryptoWalletsCore(userId, cryptoWallets);
};

/**
 * Core implementation for updating crypto wallets
 * @param accountIds Array of account IDs of the crypto wallets to update
 * @param updates The updates to apply
 * @returns Map of account IDs to success/failure status
 */
const updateCryptoWalletsCore = async (
  accountIds: string[],
  updates: Partial<CryptoWallet>
): Promise<Map<string, boolean>> => {
  if (!accountIds.length) return new Map();

  const results = new Map<string, boolean>();

  try {
    const supabase = createClient();

    // Create a copy of updates to avoid modifying the original object
    const cryptoUpdates = { ...updates };

    // Update all crypto wallets in a batch
    const { error } = await supabase
      .from("crypto_wallets")
      .update(cryptoUpdates)
      .in("account_id", accountIds);

    if (error) {
      console.error("Error updating crypto wallets:", error.message);
      // Set all as failed
      accountIds.forEach((id) => results.set(id, false));
      return results;
    }

    // Set all as successful
    accountIds.forEach((id) => results.set(id, true));
    return results;
  } catch (error) {
    console.error("Exception updating crypto wallets:", error);
    // Set all as failed
    accountIds.forEach((id) => results.set(id, false));
    return results;
  }
};

/**
 * Updates a crypto wallet
 * @param accountId The account_id of the crypto wallet to update
 * @param updates The crypto wallet fields to update
 * @returns True if successful, false otherwise
 */
export const updateCryptoWallet = async (
  accountId: string,
  updates: Partial<CryptoWallet>
): Promise<boolean> => {
  if (!accountId) {
    console.error("No account ID provided to updateCryptoWallet");
    return false;
  }

  const results = await updateCryptoWalletsCore([accountId], updates);
  return results.get(accountId) || false;
};

/**
 * Updates multiple crypto wallets with the same updates
 * @param accountIds Array of account IDs of the crypto wallets to update
 * @param updates The updates to apply to all crypto wallets
 * @returns Map of account IDs to success/failure status
 */
export const updateCryptoWalletsBatch = async (
  accountIds: string[],
  updates: Partial<CryptoWallet>
): Promise<Map<string, boolean>> => {
  return await updateCryptoWalletsCore(accountIds, updates);
};

/**
 * Fetches a crypto wallet account with its transactions
 * @param accountId The account_id of the crypto wallet account
 * @returns The crypto wallet with transactions or null if not found
 */
export const fetchCryptoWalletWithTransactions = async (
  accountId: string
): Promise<CryptoWallet & { transactions: CryptoWalletTransaction[] } | null> => {
  if (!accountId) {
    console.error("No account ID provided to fetchCryptoWalletWithTransactions");
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
        crypto_wallets!inner(account_id, wallet_address, coin_symbol, balance),
        crypto_wallet_transactions(*)
      `
      )
      .eq("id", accountId)
      .order("crypto_wallet_transactions.transaction_date", {
        ascending: false,
      })
      .single();

    if (error) {
      console.error(
        "Error fetching crypto wallet with transactions:",
        error.message
      );
      return null;
    }

    if (!data) {
      return null;
    }

    // Restructure the data to match the expected CryptoWallet with transactions format
    const cryptoWallet: CryptoWallet & { transactions: CryptoWalletTransaction[] } = {
      ...data,
      account_type: data.account_type as AccountType,
      transactions: data.crypto_wallet_transactions as CryptoWalletTransaction[],
    };

    return cryptoWallet;
  } catch (error) {
    console.error("Exception fetching crypto wallet with transactions:", error);
    return null;
  }
};

/**
 * Fetches a list of crypto wallets with their transactions
 * @param user_id The user_id of the owner of the crypto wallets
 * @param dateRange Optional date range to filter transactions (format: { start: Date, end: Date })
 * @returns The crypto wallets and their transactions or empty object if not found
 */
export const fetchCryptoWalletsWithTransactions = async (
  user_id: string,
  dateRange?: { start: Date; end: Date }
): Promise<Record<string, CryptoWallet & { transactions: CryptoWalletTransaction[] }>> => {
  const supabase = createClient();

  if (!user_id) {
    console.error("No user ID provided to fetchCryptoWalletsWithTransactions");
    return {};
  }

  try {
    // First, fetch all crypto wallets for the user
    const { data: accountsData, error: accountsError } = await supabase
      .from("accounts")
      .select(
        `
        *,
        crypto_wallets!inner(account_id, wallet_address, coin_symbol, balance)
        `
      )
      .eq("user_id", user_id)
      .eq("account_type", AccountType.CRYPTO);

    if (accountsError) {
      console.error("Error fetching crypto wallets:", accountsError.message);
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
          .from("crypto_wallet_transactions")
          .select("*")
          .eq("account_id", account.id);

        // Apply date range filter if provided
        if (dateRange) {
          transactionsQuery = transactionsQuery
            .gte("transaction_date", dateRange.start.toISOString())
            .lte("transaction_date", dateRange.end.toISOString());
        }

        // Execute the query with ordering
        const { data: transactionsData, error: transactionsError } = await transactionsQuery
          .order("transaction_date", { ascending: false });

        const { account_id, ...cryptoWalletWithoutId } = account.crypto_wallets;
        const { crypto_wallets, ...accountWithoutCryptoWallet } = account;

        if (transactionsError) {
          console.error(
            `Error fetching transactions for account ${account.id}:`,
            transactionsError.message
          );

          // If there's an error fetching transactions, we'll still return the account
          // but with an empty transactions array
          return {
            ...accountWithoutCryptoWallet,
            ...cryptoWalletWithoutId,
            account_type: account.account_type as AccountType,
            transactions: [],
          };
        }

        // Combine account data with transactions
        return {
          ...accountWithoutCryptoWallet,
          ...cryptoWalletWithoutId,
          account_type: account.account_type as AccountType,
          transactions: transactionsData as CryptoWalletTransaction[],
        };
      })
    );

    // Convert array to Record<string, CryptoWallet & { transactions: CryptoWalletTransaction[] }>
    const accountsRecord: Record<string, CryptoWallet & { transactions: CryptoWalletTransaction[] }> = {};
    for (const account of accountsWithTransactions) {
      accountsRecord[account.id] = account as CryptoWallet & { transactions: CryptoWalletTransaction[] };
    }

    return accountsRecord;
  } catch (error) {
    console.error("Exception fetching crypto wallets with transactions:", error);
    return {};
  }
};