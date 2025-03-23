import { createClient } from "@/utils/supabase/client";
import { Account, AccountType, InvestmentAccount } from "@/types/Account";
import { createAccountsCore, deleteAccountsCore } from "./Accounts";

// Type aliases for better readability
type InvestmentAccountData = Omit<InvestmentAccount, "account_id">;

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
            results.set(investmentAccount.account_id, investmentAccount as InvestmentAccount);
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
    investmentAccounts: InvestmentAccountData[]
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
            account_type: AccountType.STOCK, // Assuming these are stock/investment accounts
            balance: investmentAccount.balance,
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
                balance: investmentAccounts[index].balance,
                currency: investmentAccounts[index].currency,
            })
        );

        const { error: investmentError } = await supabase
            .from("investment_accounts")
            .insert(investmentAccountsToInsert);

        if (investmentError) {
            console.error("Error creating investment accounts:", investmentError.message);
            // Try to clean up the created accounts
            const accountIdsToDelete = accountsResult.map(
                (account: Account) => account.id
            );
            await deleteAccountsCore(accountIdsToDelete);
            return null;
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
    investmentAccount: InvestmentAccountData
): Promise<string | null> => {
    if (!userId) {
        console.error("No user ID provided to createInvestmentAccount");
        return null;
    }

    const results = await createInvestmentAccountsCore(userId, [investmentAccount]);
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
    investmentAccounts: InvestmentAccountData[]
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