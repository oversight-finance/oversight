/**
 * Recurring schedule type definitions that match the database schema
 */

/**
 * Common frequency options for recurring schedules
 */
export enum FrequencyType {
  DAILY = "daily",
  WEEKLY = "weekly",
  BIWEEKLY = "biweekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  ANNUALLY = "annually",
}

/**
 * Represents a recurring schedule as defined in the recurring_schedules table
 */
export interface RecurringSchedule {
  id: string;
  account_id: string;
  frequency: string;
  start_date: string;
  end_date?: string | null;
  merchant: string;
  category: string;
  created_at: string;
  amount: number;
}

/**
 * Extended recurring schedule with UI-specific fields
 */
export interface ExtendedRecurringSchedule extends RecurringSchedule {
  is_active: boolean;
  display_name?: string;
  next_occurrence?: string;
  total_occurrences?: number;
  total_amount?: number;
}

/**
 * Calculate the next occurrence date based on frequency and start date
 */
export const calculateNextOccurrence = (
  schedule: RecurringSchedule
): string | null => {
  if (schedule.end_date && new Date(schedule.end_date) < new Date()) {
    return null; // Schedule has ended
  }

  const today = new Date();
  const startDate = new Date(schedule.start_date);
  let nextDate: Date;

  switch (schedule.frequency) {
    case FrequencyType.DAILY:
      // Find the next day that is >= today
      nextDate = new Date(today);
      if (startDate > today) {
        nextDate = startDate;
      }
      break;

    case FrequencyType.WEEKLY:
      // Find the next weekly occurrence from start date
      nextDate = new Date(startDate);
      while (nextDate < today) {
        nextDate.setDate(nextDate.getDate() + 7);
      }
      break;

    case FrequencyType.BIWEEKLY:
      // Find the next bi-weekly occurrence from start date
      nextDate = new Date(startDate);
      while (nextDate < today) {
        nextDate.setDate(nextDate.getDate() + 14);
      }
      break;

    case FrequencyType.MONTHLY:
      // Find the next monthly occurrence
      nextDate = new Date(startDate);
      while (nextDate < today) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      break;

    case FrequencyType.QUARTERLY:
      // Find the next quarterly occurrence
      nextDate = new Date(startDate);
      while (nextDate < today) {
        nextDate.setMonth(nextDate.getMonth() + 3);
      }
      break;

    case FrequencyType.ANNUALLY:
      // Find the next annual occurrence
      nextDate = new Date(startDate);
      while (nextDate < today) {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
      break;

    default:
      return null;
  }

  return nextDate.toISOString().split("T")[0];
};

/**
 * Check if a recurring schedule is active
 */
export const isScheduleActive = (schedule: RecurringSchedule): boolean => {
  const today = new Date();

  // If end date exists and is in the past, schedule is inactive
  if (schedule.end_date && new Date(schedule.end_date) < today) {
    return false;
  }

  // If start date is in the future, schedule is not yet active
  if (new Date(schedule.start_date) > today) {
    return false;
  }

  return true;
};
