export enum BudgetFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export enum BudgetCategory {
  // Expense categories
  GROCERIES = 'Groceries',
  FOOD = 'Food',
  DINING = 'Dining',
  ENTERTAINMENT = 'Entertainment',
  SHOPPING = 'Shopping',
  HOUSING = 'Housing',
  TRANSPORTATION = 'Transportation',
  TRAVEL = 'Travel',
  HEALTH = 'Health',
  EDUCATION = 'Education',
  UTILITIES = 'Utilities',
  SUBSCRIPTIONS = 'Subscriptions',
  PERSONAL_CARE = 'Personal Care',
  GIFTS = 'Gifts',
  
  // Income categories
  SALARY = 'Salary',
  BONUS = 'Bonus',
  INVESTMENTS = 'Investments',
  INTEREST = 'Interest',
  DIVIDENDS = 'Dividends',
  RENTAL = 'Rental Income',
  REFUNDS = 'Refunds',
  SIDE_HUSTLE = 'Side Hustle',
  SAVINGS = 'Savings',
  
  // General
  MISCELLANEOUS = 'Miscellaneous'
}

export interface Budget {
  id: string;
  budget_name: string; // Name of the budget
  category: string; // Stored as comma-separated categories in the database
  budget_amount: number;
  frequency: BudgetFrequency;
}

export type BudgetCategoryArray = BudgetCategory[];

// Helper functions to convert between array and string
export function categoriesToString(categories: BudgetCategory[]): string {
  return categories.join(',');
}

export function stringToCategories(categoriesString: string): BudgetCategory[] {
  if (!categoriesString) return [];
  return categoriesString.split(',') as BudgetCategory[];
}

// Exported category arrays for use across the application
export const INCOME_CATEGORIES = [
  BudgetCategory.SALARY,
  BudgetCategory.BONUS,
  BudgetCategory.INVESTMENTS,
  BudgetCategory.INTEREST,
  BudgetCategory.DIVIDENDS,
  BudgetCategory.RENTAL,
  BudgetCategory.REFUNDS,
  BudgetCategory.SIDE_HUSTLE,
  BudgetCategory.SAVINGS,
  BudgetCategory.GIFTS,
  BudgetCategory.MISCELLANEOUS,
];

export const EXPENSE_CATEGORIES = [
  BudgetCategory.GROCERIES,
  BudgetCategory.FOOD,
  BudgetCategory.DINING,
  BudgetCategory.ENTERTAINMENT,
  BudgetCategory.SHOPPING,
  BudgetCategory.HOUSING,
  BudgetCategory.TRANSPORTATION,
  BudgetCategory.TRAVEL,
  BudgetCategory.HEALTH,
  BudgetCategory.EDUCATION,
  BudgetCategory.UTILITIES,
  BudgetCategory.SUBSCRIPTIONS,
  BudgetCategory.PERSONAL_CARE,
  BudgetCategory.GIFTS,
  BudgetCategory.MISCELLANEOUS,
];
