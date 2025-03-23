import { createClient } from "@/utils/supabase/client";
import { Account, AccountType, CryptoWallet } from "@/types/Account";
import { createAccountsCore, deleteAccountsCore } from "./Accounts";

// Type aliases for better readability
type CryptoWalletData = Omit<CryptoWallet, "account_id">;

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
    cryptoWallets: CryptoWalletData[]
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
                wallet_name: cryptoWallets[index].wallet_name,
                wallet_address: cryptoWallets[index].wallet_address,
                balance: cryptoWallets[index].balance,
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
    cryptoWallet: CryptoWalletData
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