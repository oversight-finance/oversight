import { createClient } from "@/utils/supabase/client";
import { Vehicle, VehiclePrice, VehicleWithPrices } from "@/types/Vehicle";

// Type aliases for better readability
type VehicleData = Omit<Vehicle, "id" | "created_at" | "updated_at">;
type VehiclePriceData = Omit<VehiclePrice, "id" | "recorded_at">;
type VehicleResult = { id: string; user_id: string };
type VehiclePriceResult = { id: string; vehicle_id: string };

/**
 * Fetches all vehicles for a user with optional filtering
 * @param userId The ID of the user whose vehicles to fetch
 * @param options Optional filtering and pagination options
 * @returns Array of vehicles or empty array if none found
 */
export const fetchUserVehicles = async (
    userId: string,
    options?: {
        limit?: number;
        offset?: number;
    }
): Promise<Vehicle[]> => {
    if (!userId) return [];

    try {
        const supabase = createClient();

        let query = supabase.from("vehicles").select("*").eq("user_id", userId);

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
            console.error("Error fetching user vehicles:", error.message);
            return [];
        }

        return data as Vehicle[];
    } catch (error) {
        console.error("Exception fetching user vehicles:", error);
        return [];
    }
};

/**
 * Core implementation for fetching multiple vehicles by their IDs
 * @param vehicleIds Array of vehicle IDs to fetch
 * @returns Map of vehicle IDs to vehicles, or empty map if none found
 */
const fetchVehiclesByIdsCore = async (
    vehicleIds: string[]
): Promise<Map<string, Vehicle>> => {
    if (!vehicleIds.length) return new Map();

    try {
        const supabase = createClient();
        const results = new Map<string, Vehicle>();

        const { data, error } = await supabase
            .from("vehicles")
            .select("*")
            .in("id", vehicleIds);

        if (error) {
            console.error("Error fetching vehicles by IDs:", error.message);
            return results;
        }

        // Map the results by ID for easy lookup
        for (const vehicle of data) {
            results.set(vehicle.id, vehicle as Vehicle);
        }

        return results;
    } catch (error) {
        console.error("Exception fetching vehicles by IDs:", error);
        return new Map();
    }
};

/**
 * Fetches a specific vehicle by ID
 * @param vehicleId The ID of the vehicle to fetch
 * @returns The vehicle or null if not found
 */
export const fetchVehicleById = async (
    vehicleId: string
): Promise<Vehicle | null> => {
    if (!vehicleId) return null;

    const results = await fetchVehiclesByIdsCore([vehicleId]);
    return results.get(vehicleId) || null;
};

/**
 * Fetches multiple vehicles by their IDs
 * @param vehicleIds Array of vehicle IDs to fetch
 * @returns Map of vehicle IDs to vehicles
 */
export const fetchVehiclesByIds = async (
    vehicleIds: string[]
): Promise<Map<string, Vehicle>> => {
    return await fetchVehiclesByIdsCore(vehicleIds);
};

/**
 * Fetches a vehicle with its price history
 * @param vehicleId The ID of the vehicle to fetch
 * @param priceLimit Optional limit for the number of prices to fetch
 * @returns The vehicle with prices or null if not found
 */
export const fetchVehicleWithPrices = async (
    vehicleId: string,
    priceLimit?: number
): Promise<VehicleWithPrices | null> => {
    if (!vehicleId) return null;

    try {
        // Fetch the vehicle first
        const vehicleResult = await fetchVehicleById(vehicleId);

        if (!vehicleResult) {
            return null;
        }

        // Fetch the price history
        const prices = await fetchVehiclePrices(vehicleId, { limit: priceLimit });

        return {
            ...vehicleResult,
            prices,
        };
    } catch (error) {
        console.error("Exception fetching vehicle with prices:", error);
        return null;
    }
};

/**
 * Core implementation for creating vehicles
 * @param vehicles Array of vehicle data to insert
 * @param addPriceEntries Whether to add price entries for vehicles with current_value
 * @returns Array of created vehicle IDs or null if creation failed
 */
const createVehiclesCore = async (
    vehicles: VehicleData[],
    addPriceEntries = true
): Promise<VehicleResult[] | null> => {
    if (!vehicles.length) return null;

    // Ensure all vehicles have a user_id
    const invalidVehicle = vehicles.find((vehicle) => !vehicle.user_id);
    if (invalidVehicle) return null;

    try {
        const supabase = createClient();
        const now = new Date().toISOString();

        // Prepare all vehicles with created_at timestamp
        const preparedVehicles = vehicles.map((vehicle) => ({
            ...vehicle,
            created_at: now,
            updated_at: now,
        }));

        // Insert all vehicles in a batch
        const { data, error } = await supabase
            .from("vehicles")
            .insert(preparedVehicles)
            .select("id, user_id");

        if (error) {
            console.error("Error creating vehicles:", error.message);
            return null;
        }

        // If requested, add price entries for vehicles with current_value
        // TODO: Add price entries for vehicles with current_value
        if (addPriceEntries) {
            const priceEntries: VehiclePriceData[] = [];
            const today = new Date().toISOString().split("T")[0];
            // Create batched price entries
            for (let i = 0; i < vehicles.length; i++) {
                if (vehicles[i].current_value !== undefined) {
                    priceEntries.push({
                        vehicle_id: data[i].id,
                        price: vehicles[i].current_value!, // Use non-null assertion since we've checked it's defined
                        price_date: today,
                    });
                }
            }

            // If there are price entries to add, add them in batch
            if (priceEntries.length > 0) {
                await addVehiclePricesBatch(priceEntries);
            }
        }

        return data as VehicleResult[];
    } catch (error) {
        console.error("Exception creating vehicles:", error);
        return null;
    }
};

/**
 * Creates a new vehicle
 * @param vehicle The vehicle data to insert
 * @returns The created vehicle ID or null if creation failed
 */
export const createVehicle = async (vehicle: VehicleData): Promise<string | null> => {
  console.log("CREATING VEHICLE", vehicle);
    const results = await createVehiclesCore([vehicle]);
    return results ? results[0].id : null;
};

/**
 * Creates multiple vehicles in a batch
 * @param vehicles Array of vehicle data to insert
 * @returns Array of created vehicle IDs or null if creation failed
 */
export const createVehiclesBatch = async (
    vehicles: VehicleData[]
): Promise<string[] | null> => {
    const results = await createVehiclesCore(vehicles);
    return results ? results.map((r) => r.id) : null;
};

/**
 * Core implementation for updating vehicles
 * @param vehicleIds Array of vehicle IDs to update
 * @param updates The updates to apply
 * @param addPriceEntries Whether to add price entries if current_value is updated
 * @returns Map of vehicle IDs to success/failure status
 */
const updateVehiclesCore = async (
    vehicleIds: string[],
    updates: Partial<VehicleData>,
    addPriceEntries = true
): Promise<Map<string, boolean>> => {
    if (!vehicleIds.length) return new Map();

    const results = new Map<string, boolean>();

    try {
        const supabase = createClient();
        const now = new Date().toISOString();

        // Add updated_at timestamp to the updates
        const updatesWithTimestamp = {
            ...updates,
            updated_at: now,
        };

        // Update all vehicles with the given updates
        const { error } = await supabase
            .from("vehicles")
            .update(updatesWithTimestamp)
            .in("id", vehicleIds);

        if (error) {
            console.error("Error updating vehicles:", error.message);
            // Set all as failed
            vehicleIds.forEach((id) => results.set(id, false));
            return results;
        }

        // If current_value was updated and we should add price entries
        if (addPriceEntries && updates.current_value !== undefined) {
            // Create price entries for all vehicles
            const today = new Date().toISOString().split("T")[0];
            const priceEntries: VehiclePriceData[] = vehicleIds.map((vehicleId) => ({
                vehicle_id: vehicleId,
                price: updates.current_value!,
                price_date: today,
            }));

            // Add all price entries in batch
            await addVehiclePricesBatch(priceEntries);
        }

        // Set all as successful
        vehicleIds.forEach((id) => results.set(id, true));
        return results;
    } catch (error) {
        console.error("Exception updating vehicles:", error);
        // Set all as failed
        vehicleIds.forEach((id) => results.set(id, false));
        return results;
    }
};

/**
 * Updates an existing vehicle
 * @param vehicleId The ID of the vehicle to update
 * @param updates The vehicle fields to update
 * @param addPriceEntry Whether to add a price entry if current_value is updated
 * @returns True if successful, false otherwise
 */
export const updateVehicle = async (
    vehicleId: string,
    updates: Partial<VehicleData>,
    addPriceEntry = true
): Promise<boolean> => {
    if (!vehicleId) return false;

    const results = await updateVehiclesCore([vehicleId], updates, addPriceEntry);
    return results.get(vehicleId) || false;
};

/**
 * Updates multiple vehicles with the same updates
 * @param vehicleIds Array of vehicle IDs to update
 * @param updates The updates to apply to all vehicles
 * @param addPriceEntries Whether to add price entries if current_value is updated
 * @returns Map of vehicle IDs to success/failure status
 */
export const updateVehiclesBatch = async (
    vehicleIds: string[],
    updates: Partial<VehicleData>,
    addPriceEntries = true
): Promise<Map<string, boolean>> => {
    return await updateVehiclesCore(vehicleIds, updates, addPriceEntries);
};

/**
 * Core implementation for deleting vehicles
 * @param vehicleIds Array of vehicle IDs to delete
 * @returns Map of vehicle IDs to success/failure status
 */
const deleteVehiclesCore = async (
    vehicleIds: string[]
): Promise<Map<string, boolean>> => {
    if (!vehicleIds.length) return new Map();

    const results = new Map<string, boolean>();

    try {
        const supabase = createClient();

        // Delete all vehicles in a batch
        // Due to foreign key constraints with ON DELETE CASCADE,
        // deleting the vehicles will automatically delete all related prices
        const { error } = await supabase.from("vehicles").delete().in("id", vehicleIds);

        if (error) {
            console.error("Error deleting vehicles:", error.message);
            // Set all as failed
            vehicleIds.forEach((id) => results.set(id, false));
            return results;
        }

        // Set all as successful
        vehicleIds.forEach((id) => results.set(id, true));
        return results;
    } catch (error) {
        console.error("Exception deleting vehicles:", error);
        // Set all as failed
        vehicleIds.forEach((id) => results.set(id, false));
        return results;
    }
};

/**
 * Deletes a vehicle and all related prices
 * @param vehicleId The ID of the vehicle to delete
 * @returns True if successful, false otherwise
 */
export const deleteVehicle = async (vehicleId: string): Promise<boolean> => {
    if (!vehicleId) return false;

    const results = await deleteVehiclesCore([vehicleId]);
    return results.get(vehicleId) || false;
};

/**
 * Deletes multiple vehicles and their related prices
 * @param vehicleIds Array of vehicle IDs to delete
 * @returns Map of vehicle IDs to success/failure status
 */
export const deleteVehiclesBatch = async (
    vehicleIds: string[]
): Promise<Map<string, boolean>> => {
    return await deleteVehiclesCore(vehicleIds);
};

/**
 * Fetches prices for a specific vehicle with optional time range
 * @param vehicleId The ID of the vehicle whose prices to fetch
 * @param options Optional parameters for filtering and pagination
 * @returns Array of vehicle prices or empty array if none found
 */
export const fetchVehiclePrices = async (
    vehicleId: string,
    options?: {
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
    }
): Promise<VehiclePrice[]> => {
    if (!vehicleId) return [];

    try {
        const supabase = createClient();

        let query = supabase
            .from("vehicle_prices")
            .select("*")
            .eq("vehicle_id", vehicleId);

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
            console.error("Error fetching vehicle prices:", error.message);
            return [];
        }

        return data as VehiclePrice[];
    } catch (error) {
        console.error("Exception fetching vehicle prices:", error);
        return [];
    }
};

/**
 * Core implementation for adding price records for vehicles
 * @param prices Array of vehicle price data to insert
 * @param updateVehicleValues Whether to update current_value in the corresponding vehicles
 * @returns Array of created price IDs or null if creation failed
 */
const addVehiclePricesCore = async (
    prices: VehiclePriceData[],
    updateVehicleValues = true
): Promise<VehiclePriceResult[] | null> => {
    if (!prices.length) return null;

    // Ensure all prices have a vehicle_id
    const invalidPrice = prices.find((price) => !price.vehicle_id);
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
            .from("vehicle_prices")
            .insert(preparedPrices)
            .select("id, vehicle_id");

        if (error) {
            console.error("Error adding vehicle prices:", error.message);
            return null;
        }

        // If requested, update current_value in the corresponding vehicles
        if (updateVehicleValues) {
            // Group prices by vehicle_id to get the latest price for each vehicle
            const vehiclePriceMap = new Map<string, number>();
            for (const price of prices) {
                vehiclePriceMap.set(price.vehicle_id, price.price);
            }

            // Update each vehicle with its new current_value
            const updatePromises = Array.from(vehiclePriceMap.entries()).map(
                ([vehicleId, price]) =>
                    updateVehicle(vehicleId, { current_value: price }, false) // Don't create recursive price entries
            );

            await Promise.all(updatePromises);
        }

        return data as VehiclePriceResult[];
    } catch (error) {
        console.error("Exception adding vehicle prices:", error);
        return null;
    }
};

/**
 * Adds a new price record for a vehicle
 * @param vehiclePrice The vehicle price data to insert
 * @returns The created vehicle price ID or null if creation failed
 */
export const addVehiclePrice = async (
    vehiclePrice: VehiclePriceData
): Promise<string | null> => {
    const results = await addVehiclePricesCore([vehiclePrice]);
    return results ? results[0].id : null;
};

/**
 * Adds multiple price records for vehicles in a batch
 * @param vehiclePrices Array of vehicle price data to insert
 * @returns Array of created price IDs or null if creation failed
 */
export const addVehiclePricesBatch = async (
    vehiclePrices: VehiclePriceData[]
): Promise<string[] | null> => {
    const results = await addVehiclePricesCore(vehiclePrices);
    return results ? results.map((r) => r.id) : null;
}; 