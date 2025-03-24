import { formatTotalAmount } from "@/lib/utils";

/**
 * Calculates asset value growth over time
 * Use positive growth rate for appreciation, negative for depreciation
 * 
 * @param initialValue Initial asset value
 * @param growthRate Annual growth rate (percentage: positive for appreciation, negative for depreciation)
 * @param months Number of months to calculate
 * @param startDate Starting date in ISO format
 * @returns Array of monthly values with date and calculated value
 */
export const calculateAssetGrowth = (
  initialValue: number,
  growthRate: number,
  months: number,
  startDate: string
): { month: string; value: number }[] => {
  const result: { month: string; value: number }[] = [];
  const monthlyRate = growthRate / 12 / 100;
  const startDateObj = new Date(startDate);
  
  for (let i = 0; i <= months; i++) {
    const date = new Date(startDateObj);
    date.setMonth(date.getMonth() + i);
    
    // Calculate value using compound growth formula
    const newValue = initialValue * Math.pow(1 + monthlyRate, i);
    
    result.push({
      month: date.toISOString().split('T')[0].substring(0, 7), // YYYY-MM format
      value: Math.round(newValue * 100) / 100
    });
  }
  
  return result;
};

/**
 * @deprecated Use calculateAssetGrowth with positive rate instead
 */
export const calculateAppreciation = (
  initialValue: number, 
  appreciationRate: number, 
  months: number,
  startDate: string
): { month: string; value: number }[] => {
  return calculateAssetGrowth(initialValue, appreciationRate, months, startDate);
};

/**
 * @deprecated Use calculateAssetGrowth with negative rate instead
 */
export const calculateDepreciation = (
  initialValue: number, 
  depreciationRate: number, 
  months: number,
  startDate: string
): { month: string; value: number }[] => {
  return calculateAssetGrowth(initialValue, -depreciationRate, months, startDate);
};

/**
 * Calculates financing progress for loans
 */
export const calculateFinancingProgress = (
  purchaseDate: string,
  monthlyPayment: number,
  interestRate: number,
  loanTerm: number,
  purchaseValue: number
): {
  monthsPaid: number;
  totalPaid: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
} => {
  if (!purchaseDate || !monthlyPayment || !interestRate || !loanTerm || !purchaseValue) {
    return {
      monthsPaid: 0,
      totalPaid: 0,
      principalPaid: 0,
      interestPaid: 0,
      remainingBalance: purchaseValue
    };
  }

  const startDate = new Date(purchaseDate);
  const currentDate = new Date();
  
  // Calculate months elapsed
  const monthsElapsed = 
    (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
    (currentDate.getMonth() - startDate.getMonth());
  
  // Ensure we don't exceed the loan term
  const monthsPaid = Math.min(Math.max(0, monthsElapsed), loanTerm);
  
  // Calculate remaining balance using amortization formula
  const monthlyInterestRate = interestRate / 100 / 12;
  let remainingBalance = purchaseValue;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  
  for (let i = 0; i < monthsPaid; i++) {
    const interestPayment = remainingBalance * monthlyInterestRate;
    const principalPayment = monthlyPayment - interestPayment;
    
    totalInterestPaid += interestPayment;
    totalPrincipalPaid += principalPayment;
    remainingBalance -= principalPayment;
  }
  
  // Ensure remaining balance doesn't go below 0
  remainingBalance = Math.max(0, remainingBalance);
  
  return {
    monthsPaid,
    totalPaid: monthsPaid * monthlyPayment,
    principalPaid: totalPrincipalPaid,
    interestPaid: totalInterestPaid,
    remainingBalance
  };
};

/**
 * Formats a date for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formats a currency value for display
 */
export const formatCurrency = (value: number): string => {
  return formatTotalAmount(value);
}; 