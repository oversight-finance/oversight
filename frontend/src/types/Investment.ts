/**
 * Investment type definitions that match the database schema
 */

/**
 * Represents an investment account record from the investment_accounts table
 */
export interface InvestmentAccount {
  account_id: string;
  account_type: "RRSP" | "TFSA" | "General";
  institution: string;
  account_name: string;
  account_number?: string;
  contribution_room?: number;
  balance: number;
  currency: string;
}

/**
 * Represents an investment transaction from the investment_transactions table
 */
export interface InvestmentTransaction {
  id: string;
  account_id: string;
  transaction_date: string;
  transaction_type: "buy" | "sell" | "dividend" | "contribution" | "withdrawal";
  ticker_symbol?: string;
  quantity?: number;
  price_per_unit?: number;
  amount: number;
  fee?: number;
  currency: string;
}

/**
 * Extended investment account with transactions for UI
 */
export interface InvestmentAccountWithTransactions extends InvestmentAccount {
  transactions: InvestmentTransaction[];
}

/**
 * Calculates the return on investment for an investment account
 */
export const calculateInvestmentROI = (transactions: InvestmentTransaction[], currentBalance: number): number | null => {
  if (!transactions.length) return null;

  // Calculate total contributions and withdrawals
  const totalContributions = transactions.filter((t) => t.transaction_type === "contribution").reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions.filter((t) => t.transaction_type === "withdrawal").reduce((sum, t) => sum + t.amount, 0);

  const netInvestment = totalContributions - totalWithdrawals;

  if (netInvestment === 0) return null;

  return ((currentBalance - netInvestment) / netInvestment) * 100;
};
