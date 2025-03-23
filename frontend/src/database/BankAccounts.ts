import { createClient } from "@/utils/supabase/client";
import {
    Account,
    AccountType,
    BankAccount,
    BankAccountWithTransactions
} from "@/types/Account";
import { BankAccountTransaction } from "@/types/Transaction";
import {
    createAccountsCore,
    deleteAccountsCore
} from "./Accounts";

// Type aliases for better readability
type BankAccountData = Omit<BankAccount, "account_id">;

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