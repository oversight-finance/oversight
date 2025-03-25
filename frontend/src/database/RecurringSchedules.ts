import { createClient } from "@/utils/supabase/client";
import { RecurringSchedule } from "@/types/RecurringSchedule";

// Type alias for better readability
type ScheduleData = Omit<RecurringSchedule, "id" | "created_at">;
type ScheduleResult = { id: string; account_id: string };

/**
 * Fetches all recurring schedules for an account with optional filters
 * @param accountId The ID of the account whose schedules to fetch
 * @param options Optional filtering and pagination options
 * @returns Array of recurring schedules or empty array if none found
 */
export const fetchAccountRecurringSchedules = async (
  accountId: string,
  options?: {
    active?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<RecurringSchedule[]> => {
  if (!accountId) return [];

  try {
    const supabase = createClient();

    let query = supabase
      .from("recurring_schedules")
      .select("*")
      .eq("account_id", accountId);

    // Apply filter for active status if specified
    if (options?.active !== undefined) {
      const today = new Date().toISOString().split("T")[0];

      if (options.active) {
        // Active schedules: start_date <= today AND (end_date is null OR end_date >= today)
        query = query
          .lte("start_date", today)
          .or(`end_date.is.null,end_date.gte.${today}`);
      } else {
        // Inactive schedules: start_date > today OR end_date < today
        query = query.or(`start_date.gt.${today},end_date.lt.${today}`);
      }
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 20) - 1
      );
    }

    // Always sort by created_at descending for consistency
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching account recurring schedules:", error.message);
      return [];
    }

    return data as RecurringSchedule[];
  } catch (error) {
    console.error("Exception fetching account recurring schedules:", error);
    return [];
  }
};

/**
 * Core implementation for fetching multiple recurring schedules by their IDs
 * @param scheduleIds Array of schedule IDs to fetch
 * @returns Map of schedule IDs to schedules, or empty map if none found
 */
const fetchRecurringSchedulesByIdsCore = async (
  scheduleIds: string[]
): Promise<Map<string, RecurringSchedule>> => {
  if (!scheduleIds.length) return new Map();

  try {
    const supabase = createClient();
    const results = new Map<string, RecurringSchedule>();

    const { data, error } = await supabase
      .from("recurring_schedules")
      .select("*")
      .in("id", scheduleIds);

    if (error) {
      console.error("Error fetching recurring schedules by IDs:", error.message);
      return results;
    }

    // Map the results by ID for easy lookup
    for (const schedule of data) {
      results.set(schedule.id, schedule as RecurringSchedule);
    }

    return results;
  } catch (error) {
    console.error("Exception fetching recurring schedules by IDs:", error);
    return new Map();
  }
};

/**
 * Fetches a specific recurring schedule by ID
 * @param scheduleId The ID of the schedule to fetch
 * @returns The recurring schedule or null if not found
 */
export const fetchRecurringScheduleById = async (
  scheduleId: string
): Promise<RecurringSchedule | null> => {
  if (!scheduleId) return null;

  const results = await fetchRecurringSchedulesByIdsCore([scheduleId]);
  return results.get(scheduleId) || null;
};

/**
 * Fetches multiple recurring schedules by their IDs
 * @param scheduleIds Array of schedule IDs to fetch
 * @returns Map of schedule IDs to schedules
 */
export const fetchRecurringSchedulesByIds = async (
  scheduleIds: string[]
): Promise<Map<string, RecurringSchedule>> => {
  return await fetchRecurringSchedulesByIdsCore(scheduleIds);
};

/**
 * Core implementation for creating recurring schedules
 * @param schedules Array of schedule data to insert
 * @returns Array of created schedule IDs or null if creation failed
 */
const createRecurringSchedulesCore = async (
  schedules: ScheduleData[]
): Promise<ScheduleResult[] | null> => {
  if (!schedules.length) return null;

  // Ensure all schedules have an account_id
  const invalidSchedule = schedules.find(schedule => !schedule.account_id);
  if (invalidSchedule) return null;

  try {
    const supabase = createClient();
    const now = new Date().toISOString();

    // Prepare all schedules with created_at timestamp
    const preparedSchedules = schedules.map(schedule => ({
      ...schedule,
      created_at: now,
    }));

    // Insert all schedules in a batch
    const { data, error } = await supabase
      .from("recurring_schedules")
      .insert(preparedSchedules)
      .select("id, account_id");

    if (error) {
      console.error("Error creating recurring schedules:", error.message);
      return null;
    }

    return data as ScheduleResult[];
  } catch (error) {
    console.error("Exception creating recurring schedules:", error);
    return null;
  }
};

/**
 * Creates a new recurring schedule
 * @param schedule The recurring schedule data to insert
 * @returns The created schedule ID or null if creation failed
 */
export const createRecurringSchedule = async (
  schedule: ScheduleData
): Promise<string | null> => {
  const results = await createRecurringSchedulesCore([schedule]);
  return results ? results[0].id : null;
};

/**
 * Creates multiple recurring schedules in a batch
 * @param schedules Array of schedule data to insert
 * @returns Array of created schedule IDs or null if creation failed
 */
export const createRecurringSchedulesBatch = async (
  schedules: ScheduleData[]
): Promise<string[] | null> => {
  const results = await createRecurringSchedulesCore(schedules);
  return results ? results.map(r => r.id) : null;
};

/**
 * Core implementation for updating recurring schedules
 * @param scheduleIds Array of schedule IDs to update
 * @param updates The updates to apply
 * @returns Map of schedule IDs to success/failure status
 */
const updateRecurringSchedulesCore = async (
  scheduleIds: string[],
  updates: Partial<ScheduleData>
): Promise<Map<string, boolean>> => {
  if (!scheduleIds.length) return new Map();

  const results = new Map<string, boolean>();
  
  try {
    const supabase = createClient();

    // Update all schedules with the given updates
    const { error } = await supabase
      .from("recurring_schedules")
      .update(updates)
      .in("id", scheduleIds);

    if (error) {
      console.error("Error updating recurring schedules:", error.message);
      // Set all as failed
      scheduleIds.forEach(id => results.set(id, false));
      return results;
    }

    // Set all as successful
    scheduleIds.forEach(id => results.set(id, true));
    return results;
  } catch (error) {
    console.error("Exception updating recurring schedules:", error);
    // Set all as failed
    scheduleIds.forEach(id => results.set(id, false));
    return results;
  }
};

/**
 * Updates an existing recurring schedule
 * @param scheduleId The ID of the schedule to update
 * @param updates The schedule fields to update
 * @returns True if successful, false otherwise
 */
export const updateRecurringSchedule = async (
  scheduleId: string,
  updates: Partial<ScheduleData>
): Promise<boolean> => {
  if (!scheduleId) return false;

  const results = await updateRecurringSchedulesCore([scheduleId], updates);
  return results.get(scheduleId) || false;
};

/**
 * Updates multiple recurring schedules with the same updates
 * @param scheduleIds Array of schedule IDs to update
 * @param updates The updates to apply to all schedules
 * @returns Map of schedule IDs to success/failure status
 */
export const updateRecurringSchedulesBatch = async (
  scheduleIds: string[],
  updates: Partial<ScheduleData>
): Promise<Map<string, boolean>> => {
  return await updateRecurringSchedulesCore(scheduleIds, updates);
};

/**
 * Ends multiple recurring schedules by setting their end date to today
 * @param scheduleIds Array of schedule IDs to end
 * @returns Map of schedule IDs to success/failure status
 */
export const endRecurringSchedulesBatch = async (
  scheduleIds: string[]
): Promise<Map<string, boolean>> => {
  if (!scheduleIds.length) return new Map();

  try {
    const today = new Date().toISOString().split("T")[0];
    return await updateRecurringSchedulesCore(scheduleIds, { end_date: today });
  } catch (error) {
    console.error("Exception ending recurring schedules:", error);
    const results = new Map<string, boolean>();
    scheduleIds.forEach(id => results.set(id, false));
    return results;
  }
};

/**
 * Ends a recurring schedule by setting its end date to today
 * @param scheduleId The ID of the schedule to end
 * @returns True if successful, false otherwise
 */
export const endRecurringSchedule = async (
  scheduleId: string
): Promise<boolean> => {
  if (!scheduleId) return false;

  try {
    const today = new Date().toISOString().split("T")[0];
    return await updateRecurringSchedule(scheduleId, { end_date: today });
  } catch (error) {
    console.error("Exception ending recurring schedule:", error);
    return false;
  }
};

/**
 * Core implementation for deleting recurring schedules
 * @param scheduleIds Array of schedule IDs to delete
 * @returns Map of schedule IDs to success/failure status
 */
const deleteRecurringSchedulesCore = async (
  scheduleIds: string[]
): Promise<Map<string, boolean>> => {
  if (!scheduleIds.length) return new Map();

  const results = new Map<string, boolean>();
  
  try {
    const supabase = createClient();

    // Delete all schedules in a batch
    const { error } = await supabase
      .from("recurring_schedules")
      .delete()
      .in("id", scheduleIds);

    if (error) {
      console.error("Error deleting recurring schedules:", error.message);
      // Set all as failed
      scheduleIds.forEach(id => results.set(id, false));
      return results;
    }

    // Set all as successful
    scheduleIds.forEach(id => results.set(id, true));
    return results;
  } catch (error) {
    console.error("Exception deleting recurring schedules:", error);
    // Set all as failed
    scheduleIds.forEach(id => results.set(id, false));
    return results;
  }
};

/**
 * Deletes a recurring schedule
 * @param scheduleId The ID of the schedule to delete
 * @returns True if successful, false otherwise
 */
export const deleteRecurringSchedule = async (
  scheduleId: string
): Promise<boolean> => {
  if (!scheduleId) return false;

  const results = await deleteRecurringSchedulesCore([scheduleId]);
  return results.get(scheduleId) || false;
};

/**
 * Deletes multiple recurring schedules
 * @param scheduleIds Array of schedule IDs to delete
 * @returns Map of schedule IDs to success/failure status
 */
export const deleteRecurringSchedulesBatch = async (
  scheduleIds: string[]
): Promise<Map<string, boolean>> => {
  return await deleteRecurringSchedulesCore(scheduleIds);
};

/**
 * Fetches all recurring schedules that need to be processed today
 * @param date Optional date string to check (defaults to today)
 * @returns Array of active recurring schedules that need processing
 */
export const fetchSchedulesDueToday = async (
  date?: string
): Promise<RecurringSchedule[]> => {
  try {
    const supabase = createClient();
    const today = date || new Date().toISOString().split("T")[0];

    // Find all active schedules
    const { data, error } = await supabase
      .from("recurring_schedules")
      .select("*")
      .lte("start_date", today)
      .or(`end_date.is.null,end_date.gte.${today}`);

    if (error) {
      console.error("Error fetching due schedules:", error.message);
      return [];
    }

    // Filter schedules that are due today based on their frequency
    const schedulesWithDueDate = (data as RecurringSchedule[]).filter(
      (schedule) => {
        const startDate = new Date(schedule.start_date);
        const currentDate = new Date(today);

        // Calculate days between start date and today
        const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Check if today is a due date based on frequency
        switch (schedule.frequency) {
          case "daily":
            return true;

          case "weekly":
            return diffDays % 7 === 0;

          case "biweekly":
            return diffDays % 14 === 0;

          case "monthly":
            // Same day of month
            return currentDate.getDate() === startDate.getDate();

          case "quarterly":
            // Same day of month, every 3 months
            return (
              currentDate.getDate() === startDate.getDate() &&
              (currentDate.getMonth() - startDate.getMonth()) % 3 === 0
            );

          case "annually":
            // Same day and month
            return (
              currentDate.getDate() === startDate.getDate() &&
              currentDate.getMonth() === startDate.getMonth()
            );

          default:
            return false;
        }
      }
    );

    return schedulesWithDueDate;
  } catch (error) {
    console.error("Exception fetching schedules due today:", error);
    return [];
  }
};
