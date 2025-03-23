import { createClient } from "@/utils/supabase/client";
import { RealEstate, RealEstatePrice, RealEstateWithPrices } from "@/types/RealEstate";

// Type aliases for better readability
type RealEstateData = Omit<RealEstate, "id" | "created_at" | "updated_at">;
type RealEstatePriceData = Omit<RealEstatePrice, "id" | "recorded_at">;
type RealEstateResult = { id: string; user_id: string };
type RealEstatePriceResult = { id: string; real_estate_id: string };

/**
 * Fetches all real estate properties for a user with optional filtering
 * @param userId The ID of the user whose properties to fetch
 * @param options Optional filtering and pagination options
 * @returns Array of real estate properties or empty array if none found
 */
export const fetchUserRealEstate = async (
    userId: string,
    options?: {
        limit?: number;
        offset?: number;
    }
): Promise<RealEstate[]> => {
    if (!userId) return [];

    try {
        const supabase = createClient();

        let query = supabase.from("real_estate").select("*").eq("user_id", userId);

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
            console.error("Error fetching user real estate:", error.message);
            return [];
        }

        return data as RealEstate[];
    } catch (error) {
        console.error("Exception fetching user real estate:", error);
        return [];
    }
};

/**
 * Core implementation for fetching multiple real estate properties by their IDs
 * @param realEstateIds Array of real estate IDs to fetch
 * @returns Map of real estate IDs to properties, or empty map if none found
 */
const fetchRealEstateByIdsCore = async (
    realEstateIds: string[]
): Promise<Map<string, RealEstate>> => {
    if (!realEstateIds.length) return new Map();

    try {
        const supabase = createClient();
        const results = new Map<string, RealEstate>();

        const { data, error } = await supabase
            .from("real_estate")
            .select("*")
            .in("id", realEstateIds);

        if (error) {
            console.error("Error fetching real estate by IDs:", error.message);
            return results;
        }

        // Map the results by ID for easy lookup
        for (const property of data) {
            results.set(property.id, property as RealEstate);
        }

        return results;
    } catch (error) {
        console.error("Exception fetching real estate by IDs:", error);
        return new Map();
    }
};

/**
 * Fetches a specific real estate property by ID
 * @param realEstateId The ID of the property to fetch
 * @returns The property or null if not found
 */
export const fetchRealEstateById = async (
    realEstateId: string
): Promise<RealEstate | null> => {
    if (!realEstateId) return null;

    const results = await fetchRealEstateByIdsCore([realEstateId]);
    return results.get(realEstateId) || null;
};

/**
 * Fetches multiple real estate properties by their IDs
 * @param realEstateIds Array of real estate IDs to fetch
 * @returns Map of real estate IDs to properties
 */
export const fetchRealEstateByIds = async (
    realEstateIds: string[]
): Promise<Map<string, RealEstate>> => {
    return await fetchRealEstateByIdsCore(realEstateIds);
};

/**
 * Fetches a real estate property with its price history
 * @param realEstateId The ID of the property to fetch
 * @param priceLimit Optional limit for the number of prices to fetch
 * @returns The property with prices or null if not found
 */
export const fetchRealEstateWithPrices = async (
    realEstateId: string,
    priceLimit?: number
): Promise<RealEstateWithPrices | null> => {
    if (!realEstateId) return null;

    try {
        // Fetch the property first
        const propertyResult = await fetchRealEstateById(realEstateId);

        if (!propertyResult) {
            return null;
        }

        // Fetch the price history
        const prices = await fetchRealEstatePrices(realEstateId, { limit: priceLimit });

        return {
            ...propertyResult,
            prices,
        };
    } catch (error) {
        console.error("Exception fetching real estate with prices:", error);
        return null;
    }
};

/**
 * Core implementation for creating real estate properties
 * @param properties Array of real estate data to insert
 * @param addPriceEntries Whether to add price entries for properties with current_value
 * @returns Array of created property IDs or null if creation failed
 */
const createRealEstateCore = async (
    properties: RealEstateData[],
    addPriceEntries = true
): Promise<RealEstateResult[] | null> => {
    if (!properties.length) return null;

    // Ensure all properties have a user_id
    const invalidProperty = properties.find((property) => !property.user_id);
    if (invalidProperty) return null;

    try {
        const supabase = createClient();
        const now = new Date().toISOString();

        // Prepare all properties with created_at timestamp
        const preparedProperties = properties.map((property) => ({
            ...property,
            created_at: now,
            updated_at: now,
        }));

        // Insert all properties in a batch
        const { data, error } = await supabase
            .from("real_estate")
            .insert(preparedProperties)
            .select("id, user_id");

        if (error) {
            console.error("Error creating real estate properties:", error.message);
            return null;
        }

        // If requested, add price entries for properties with current_value
        if (addPriceEntries) {
            const priceEntries: RealEstatePriceData[] = [];
            const today = new Date().toISOString().split("T")[0];

            // Create batched price entries
            for (let i = 0; i < properties.length; i++) {
                if (properties[i].current_value !== undefined) {
                    priceEntries.push({
                        real_estate_id: data[i].id,
                        price: properties[i].current_value,
                        price_date: today,
                    });
                }
            }

            // If there are price entries to add, add them in batch
            if (priceEntries.length > 0) {
                await addRealEstatePricesBatch(priceEntries);
            }
        }

        return data as RealEstateResult[];
    } catch (error) {
        console.error("Exception creating real estate properties:", error);
        return null;
    }
};

/**
 * Creates a new real estate property
 * @param property The real estate data to insert
 * @returns The created property ID or null if creation failed
 */
export const createRealEstate = async (property: RealEstateData): Promise<string | null> => {
    const results = await createRealEstateCore([property]);
    return results ? results[0].id : null;
};

/**
 * Creates multiple real estate properties in a batch
 * @param properties Array of real estate data to insert
 * @returns Array of created property IDs or null if creation failed
 */
export const createRealEstateBatch = async (
    properties: RealEstateData[]
): Promise<string[] | null> => {
    const results = await createRealEstateCore(properties);
    return results ? results.map((r) => r.id) : null;
};

/**
 * Core implementation for updating real estate properties
 * @param realEstateIds Array of real estate IDs to update
 * @param updates The updates to apply
 * @param addPriceEntries Whether to add price entries if current_value is updated
 * @returns Map of real estate IDs to success/failure status
 */
const updateRealEstateCore = async (
    realEstateIds: string[],
    updates: Partial<RealEstateData>,
    addPriceEntries = true
): Promise<Map<string, boolean>> => {
    if (!realEstateIds.length) return new Map();

    const results = new Map<string, boolean>();

    try {
        const supabase = createClient();
        const now = new Date().toISOString();

        // Add updated_at timestamp to the updates
        const updatesWithTimestamp = {
            ...updates,
            updated_at: now,
        };

        // Update all properties with the given updates
        const { error } = await supabase
            .from("real_estate")
            .update(updatesWithTimestamp)
            .in("id", realEstateIds);

        if (error) {
            console.error("Error updating real estate properties:", error.message);
            // Set all as failed
            realEstateIds.forEach((id) => results.set(id, false));
            return results;
        }

        // If current_value was updated and we should add price entries
        if (addPriceEntries && updates.current_value !== undefined) {
            // Create price entries for all properties
            const today = new Date().toISOString().split("T")[0];
            const priceEntries: RealEstatePriceData[] = realEstateIds.map((realEstateId) => ({
                real_estate_id: realEstateId,
                price: updates.current_value!,
                price_date: today,
            }));

            // Add all price entries in batch
            await addRealEstatePricesBatch(priceEntries);
        }

        // Set all as successful
        realEstateIds.forEach((id) => results.set(id, true));
        return results;
    } catch (error) {
        console.error("Exception updating real estate properties:", error);
        // Set all as failed
        realEstateIds.forEach((id) => results.set(id, false));
        return results;
    }
};

/**
 * Updates an existing real estate property
 * @param realEstateId The ID of the property to update
 * @param updates The property fields to update
 * @param addPriceEntry Whether to add a price entry if current_value is updated
 * @returns True if successful, false otherwise
 */
export const updateRealEstate = async (
    realEstateId: string,
    updates: Partial<RealEstateData>,
    addPriceEntry = true
): Promise<boolean> => {
    if (!realEstateId) return false;

    const results = await updateRealEstateCore([realEstateId], updates, addPriceEntry);
    return results.get(realEstateId) || false;
};

/**
 * Updates multiple real estate properties with the same updates
 * @param realEstateIds Array of real estate IDs to update
 * @param updates The updates to apply to all properties
 * @param addPriceEntries Whether to add price entries if current_value is updated
 * @returns Map of real estate IDs to success/failure status
 */
export const updateRealEstateBatch = async (
    realEstateIds: string[],
    updates: Partial<RealEstateData>,
    addPriceEntries = true
): Promise<Map<string, boolean>> => {
    return await updateRealEstateCore(realEstateIds, updates, addPriceEntries);
};

/**
 * Core implementation for deleting real estate properties
 * @param realEstateIds Array of real estate IDs to delete
 * @returns Map of real estate IDs to success/failure status
 */
const deleteRealEstateCore = async (
    realEstateIds: string[]
): Promise<Map<string, boolean>> => {
    if (!realEstateIds.length) return new Map();

    const results = new Map<string, boolean>();

    try {
        const supabase = createClient();

        // Delete all properties in a batch
        // Due to foreign key constraints with ON DELETE CASCADE,
        // deleting the properties will automatically delete all related prices
        const { error } = await supabase.from("real_estate").delete().in("id", realEstateIds);

        if (error) {
            console.error("Error deleting real estate properties:", error.message);
            // Set all as failed
            realEstateIds.forEach((id) => results.set(id, false));
            return results;
        }

        // Set all as successful
        realEstateIds.forEach((id) => results.set(id, true));
        return results;
    } catch (error) {
        console.error("Exception deleting real estate properties:", error);
        // Set all as failed
        realEstateIds.forEach((id) => results.set(id, false));
        return results;
    }
};

/**
 * Deletes a real estate property and all related prices
 * @param realEstateId The ID of the property to delete
 * @returns True if successful, false otherwise
 */
export const deleteRealEstate = async (realEstateId: string): Promise<boolean> => {
    if (!realEstateId) return false;

    const results = await deleteRealEstateCore([realEstateId]);
    return results.get(realEstateId) || false;
};

/**
 * Deletes multiple real estate properties and their related prices
 * @param realEstateIds Array of real estate IDs to delete
 * @returns Map of real estate IDs to success/failure status
 */
export const deleteRealEstateBatch = async (
    realEstateIds: string[]
): Promise<Map<string, boolean>> => {
    return await deleteRealEstateCore(realEstateIds);
};

/**
 * Fetches prices for a specific real estate property with optional time range
 * @param realEstateId The ID of the property whose prices to fetch
 * @param options Optional parameters for filtering and pagination
 * @returns Array of real estate prices or empty array if none found
 */
export const fetchRealEstatePrices = async (
    realEstateId: string,
    options?: {
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
    }
): Promise<RealEstatePrice[]> => {
    if (!realEstateId) return [];

    try {
        const supabase = createClient();

        let query = supabase
            .from("real_estate_prices")
            .select("*")
            .eq("real_estate_id", realEstateId);

        // Apply date range filters if provided
        if (options?.startDate) {
            query = query.gte("price_date", options.startDate);
        }

        if (options?.endDate) {
            query = query.lte("price_date", options.endDate);
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

        // Always sort by date descending
        query = query.order("price_date", { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching real estate prices:", error.message);
            return [];
        }

        return data as RealEstatePrice[];
    } catch (error) {
        console.error("Exception fetching real estate prices:", error);
        return [];
    }
};

/**
 * Core implementation for adding price records for real estate properties
 * @param prices Array of real estate price data to insert
 * @param updatePropertyValues Whether to update current_value in the corresponding properties
 * @returns Array of created price IDs or null if creation failed
 */
const addRealEstatePricesCore = async (
    prices: RealEstatePriceData[],
    updatePropertyValues = true
): Promise<RealEstatePriceResult[] | null> => {
    if (!prices.length) return null;

    // Ensure all prices have a real_estate_id
    const invalidPrice = prices.find((price) => !price.real_estate_id);
    if (invalidPrice) return null;

    try {
        const supabase = createClient();
        const now = new Date().toISOString();

        // Prepare all prices with recorded_at timestamp
        const preparedPrices = prices.map((price) => ({
            ...price,
            recorded_at: now,
        }));

        // Insert all prices in a batch
        const { data, error } = await supabase
            .from("real_estate_prices")
            .insert(preparedPrices)
            .select("id, real_estate_id");

        if (error) {
            console.error("Error adding real estate prices:", error.message);
            return null;
        }

        // If requested, update current_value in the corresponding properties
        if (updatePropertyValues) {
            // Group prices by real_estate_id to get the latest price for each property
            const propertyPriceMap = new Map<string, number>();
            for (const price of prices) {
                propertyPriceMap.set(price.real_estate_id, price.price);
            }

            // Update each property with its new current_value
            const updatePromises = Array.from(propertyPriceMap.entries()).map(
                ([realEstateId, price]) =>
                    updateRealEstate(realEstateId, { current_value: price }, false) // Don't create recursive price entries
            );

            await Promise.all(updatePromises);
        }

        return data as RealEstatePriceResult[];
    } catch (error) {
        console.error("Exception adding real estate prices:", error);
        return null;
    }
};

/**
 * Adds a new price record for a real estate property
 * @param realEstatePrice The real estate price data to insert
 * @returns The created price ID or null if creation failed
 */
export const addRealEstatePrice = async (
    realEstatePrice: RealEstatePriceData
): Promise<string | null> => {
    const results = await addRealEstatePricesCore([realEstatePrice]);
    return results ? results[0].id : null;
};

/**
 * Adds multiple price records for real estate properties in a batch
 * @param realEstatePrices Array of real estate price data to insert
 * @returns Array of created price IDs or null if creation failed
 */
export const addRealEstatePricesBatch = async (
    realEstatePrices: RealEstatePriceData[]
): Promise<string[] | null> => {
    const results = await addRealEstatePricesCore(realEstatePrices);
    return results ? results.map((r) => r.id) : null;
}; 