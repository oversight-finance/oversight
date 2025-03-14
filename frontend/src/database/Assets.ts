import { createClient } from "@/utils/supabase/client";
import { Asset, AssetPrice, AssetWithPrices } from "@/types/Asset";

// Type aliases for better readability
type AssetData = Omit<Asset, "id" | "created_at">;
type AssetPriceData = Omit<AssetPrice, "id" | "recorded_at">;
type AssetResult = { id: string; user_id: string };
type AssetPriceResult = { id: string; asset_id: string };

/**
 * Fetches all assets for a user with optional filtering
 * @param userId The ID of the user whose assets to fetch
 * @param options Optional filtering and pagination options
 * @returns Array of assets or empty array if none found
 */
export const fetchUserAssets = async (
  userId: string,
  options?: {
    type?: string;
    limit?: number;
    offset?: number;
  }
): Promise<Asset[]> => {
  if (!userId) return [];

  try {
    const supabase = createClient();

    let query = supabase.from("assets").select("*").eq("user_id", userId);

    // Apply optional filters
    if (options?.type) {
      query = query.eq("type", options.type);
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
      console.error("Error fetching user assets:", error.message);
      return [];
    }

    return data as Asset[];
  } catch (error) {
    console.error("Exception fetching user assets:", error);
    return [];
  }
};

/**
 * Core implementation for fetching multiple assets by their IDs
 * @param assetIds Array of asset IDs to fetch
 * @returns Map of asset IDs to assets, or empty map if none found
 */
const fetchAssetsByIdsCore = async (
  assetIds: string[]
): Promise<Map<string, Asset>> => {
  if (!assetIds.length) return new Map();

  try {
    const supabase = createClient();
    const results = new Map<string, Asset>();

    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .in("id", assetIds);

    if (error) {
      console.error("Error fetching assets by IDs:", error.message);
      return results;
    }

    // Map the results by ID for easy lookup
    for (const asset of data) {
      results.set(asset.id, asset as Asset);
    }

    return results;
  } catch (error) {
    console.error("Exception fetching assets by IDs:", error);
    return new Map();
  }
};

/**
 * Fetches a specific asset by ID
 * @param assetId The ID of the asset to fetch
 * @returns The asset or null if not found
 */
export const fetchAssetById = async (
  assetId: string
): Promise<Asset | null> => {
  if (!assetId) return null;

  const results = await fetchAssetsByIdsCore([assetId]);
  return results.get(assetId) || null;
};

/**
 * Fetches multiple assets by their IDs
 * @param assetIds Array of asset IDs to fetch
 * @returns Map of asset IDs to assets
 */
export const fetchAssetsByIds = async (
  assetIds: string[]
): Promise<Map<string, Asset>> => {
  return await fetchAssetsByIdsCore(assetIds);
};

/**
 * Fetches an asset with its price history
 * @param assetId The ID of the asset to fetch
 * @param priceLimit Optional limit for the number of prices to fetch
 * @returns The asset with prices or null if not found
 */
export const fetchAssetWithPrices = async (
  assetId: string,
  priceLimit?: number
): Promise<AssetWithPrices | null> => {
  if (!assetId) return null;

  try {
    // Fetch the asset first
    const assetResult = await fetchAssetById(assetId);

    if (!assetResult) {
      return null;
    }

    // Fetch the price history
    const prices = await fetchAssetPrices(assetId, { limit: priceLimit });

    return {
      ...assetResult,
      prices,
    };
  } catch (error) {
    console.error("Exception fetching asset with prices:", error);
    return null;
  }
};

/**
 * Core implementation for creating assets
 * @param assets Array of asset data to insert
 * @param addPriceEntries Whether to add price entries for assets with current_value
 * @returns Array of created asset IDs or null if creation failed
 */
const createAssetsCore = async (
  assets: AssetData[],
  addPriceEntries = true
): Promise<AssetResult[] | null> => {
  if (!assets.length) return null;

  // Ensure all assets have a user_id
  const invalidAsset = assets.find((asset) => !asset.user_id);
  if (invalidAsset) return null;

  try {
    const supabase = createClient();
    const now = new Date().toISOString();

    // Prepare all assets with created_at timestamp
    const preparedAssets = assets.map((asset) => ({
      ...asset,
      created_at: now,
    }));

    // Insert all assets in a batch
    const { data, error } = await supabase
      .from("assets")
      .insert(preparedAssets)
      .select("id, user_id");

    if (error) {
      console.error("Error creating assets:", error.message);
      return null;
    }

    // If requested, add price entries for assets with current_value
    if (addPriceEntries) {
      const priceEntries: AssetPriceData[] = [];
      const today = new Date().toISOString().split("T")[0];

      // Create batched price entries
      for (let i = 0; i < assets.length; i++) {
        if (assets[i].current_value !== undefined) {
          priceEntries.push({
            asset_id: data[i].id,
            price: assets[i].current_value,
            price_date: today,
          });
        }
      }

      // If there are price entries to add, add them in batch
      if (priceEntries.length > 0) {
        await addAssetPricesBatch(priceEntries);
      }
    }

    return data as AssetResult[];
  } catch (error) {
    console.error("Exception creating assets:", error);
    return null;
  }
};

/**
 * Creates a new asset
 * @param asset The asset data to insert
 * @returns The created asset ID or null if creation failed
 */
export const createAsset = async (asset: AssetData): Promise<string | null> => {
  const results = await createAssetsCore([asset]);
  return results ? results[0].id : null;
};

/**
 * Creates multiple assets in a batch
 * @param assets Array of asset data to insert
 * @returns Array of created asset IDs or null if creation failed
 */
export const createAssetsBatch = async (
  assets: AssetData[]
): Promise<string[] | null> => {
  const results = await createAssetsCore(assets);
  return results ? results.map((r) => r.id) : null;
};

/**
 * Core implementation for updating assets
 * @param assetIds Array of asset IDs to update
 * @param updates The updates to apply
 * @param addPriceEntries Whether to add price entries if current_value is updated
 * @returns Map of asset IDs to success/failure status
 */
const updateAssetsCore = async (
  assetIds: string[],
  updates: Partial<AssetData>,
  addPriceEntries = true
): Promise<Map<string, boolean>> => {
  if (!assetIds.length) return new Map();

  const results = new Map<string, boolean>();

  try {
    const supabase = createClient();

    // Update all assets with the given updates
    const { error } = await supabase
      .from("assets")
      .update(updates)
      .in("id", assetIds);

    if (error) {
      console.error("Error updating assets:", error.message);
      // Set all as failed
      assetIds.forEach((id) => results.set(id, false));
      return results;
    }

    // If current_value was updated and we should add price entries
    if (addPriceEntries && updates.current_value !== undefined) {
      // Create price entries for all assets
      const today = new Date().toISOString().split("T")[0];
      const priceEntries: AssetPriceData[] = assetIds.map((assetId) => ({
        asset_id: assetId,
        price: updates.current_value!,
        price_date: today,
      }));

      // Add all price entries in batch
      await addAssetPricesBatch(priceEntries);
    }

    // Set all as successful
    assetIds.forEach((id) => results.set(id, true));
    return results;
  } catch (error) {
    console.error("Exception updating assets:", error);
    // Set all as failed
    assetIds.forEach((id) => results.set(id, false));
    return results;
  }
};

/**
 * Updates an existing asset
 * @param assetId The ID of the asset to update
 * @param updates The asset fields to update
 * @param addPriceEntry Whether to add a price entry if current_value is updated
 * @returns True if successful, false otherwise
 */
export const updateAsset = async (
  assetId: string,
  updates: Partial<AssetData>,
  addPriceEntry = true
): Promise<boolean> => {
  if (!assetId) return false;

  const results = await updateAssetsCore([assetId], updates, addPriceEntry);
  return results.get(assetId) || false;
};

/**
 * Updates multiple assets with the same updates
 * @param assetIds Array of asset IDs to update
 * @param updates The updates to apply to all assets
 * @param addPriceEntries Whether to add price entries if current_value is updated
 * @returns Map of asset IDs to success/failure status
 */
export const updateAssetsBatch = async (
  assetIds: string[],
  updates: Partial<AssetData>,
  addPriceEntries = true
): Promise<Map<string, boolean>> => {
  return await updateAssetsCore(assetIds, updates, addPriceEntries);
};

/**
 * Core implementation for deleting assets
 * @param assetIds Array of asset IDs to delete
 * @returns Map of asset IDs to success/failure status
 */
const deleteAssetsCore = async (
  assetIds: string[]
): Promise<Map<string, boolean>> => {
  if (!assetIds.length) return new Map();

  const results = new Map<string, boolean>();

  try {
    const supabase = createClient();

    // Delete all assets in a batch
    // Due to foreign key constraints with ON DELETE CASCADE,
    // deleting the assets will automatically delete all related prices
    const { error } = await supabase.from("assets").delete().in("id", assetIds);

    if (error) {
      console.error("Error deleting assets:", error.message);
      // Set all as failed
      assetIds.forEach((id) => results.set(id, false));
      return results;
    }

    // Set all as successful
    assetIds.forEach((id) => results.set(id, true));
    return results;
  } catch (error) {
    console.error("Exception deleting assets:", error);
    // Set all as failed
    assetIds.forEach((id) => results.set(id, false));
    return results;
  }
};

/**
 * Deletes an asset and all related prices
 * @param assetId The ID of the asset to delete
 * @returns True if successful, false otherwise
 */
export const deleteAsset = async (assetId: string): Promise<boolean> => {
  if (!assetId) return false;

  const results = await deleteAssetsCore([assetId]);
  return results.get(assetId) || false;
};

/**
 * Deletes multiple assets and their related prices
 * @param assetIds Array of asset IDs to delete
 * @returns Map of asset IDs to success/failure status
 */
export const deleteAssetsBatch = async (
  assetIds: string[]
): Promise<Map<string, boolean>> => {
  return await deleteAssetsCore(assetIds);
};

/**
 * Fetches prices for a specific asset with optional time range
 * @param assetId The ID of the asset whose prices to fetch
 * @param options Optional parameters for filtering and pagination
 * @returns Array of asset prices or empty array if none found
 */
export const fetchAssetPrices = async (
  assetId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<AssetPrice[]> => {
  if (!assetId) return [];

  try {
    const supabase = createClient();

    let query = supabase
      .from("asset_prices")
      .select("*")
      .eq("asset_id", assetId);

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
      console.error("Error fetching asset prices:", error.message);
      return [];
    }

    return data as AssetPrice[];
  } catch (error) {
    console.error("Exception fetching asset prices:", error);
    return [];
  }
};

/**
 * Core implementation for adding price records for assets
 * @param prices Array of asset price data to insert
 * @param updateAssetValues Whether to update current_value in the corresponding assets
 * @returns Array of created price IDs or null if creation failed
 */
const addAssetPricesCore = async (
  prices: AssetPriceData[],
  updateAssetValues = true
): Promise<AssetPriceResult[] | null> => {
  if (!prices.length) return null;

  // Ensure all prices have an asset_id
  const invalidPrice = prices.find((price) => !price.asset_id);
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
      .from("asset_prices")
      .insert(preparedPrices)
      .select("id, asset_id");

    if (error) {
      console.error("Error adding asset prices:", error.message);
      return null;
    }

    // If requested, update current_value in the corresponding assets
    if (updateAssetValues) {
      // Group prices by asset_id to get the latest price for each asset
      const assetPriceMap = new Map<string, number>();
      for (const price of prices) {
        assetPriceMap.set(price.asset_id, price.price);
      }

      // Update each asset with its new current_value
      const updatePromises = Array.from(assetPriceMap.entries()).map(
        ([assetId, price]) =>
          updateAsset(assetId, { current_value: price }, false) // Don't create recursive price entries
      );

      await Promise.all(updatePromises);
    }

    return data as AssetPriceResult[];
  } catch (error) {
    console.error("Exception adding asset prices:", error);
    return null;
  }
};

/**
 * Adds a new price record for an asset
 * @param assetPrice The asset price data to insert
 * @returns The created asset price ID or null if creation failed
 */
export const addAssetPrice = async (
  assetPrice: AssetPriceData
): Promise<string | null> => {
  const results = await addAssetPricesCore([assetPrice]);
  return results ? results[0].id : null;
};

/**
 * Adds multiple price records for assets in a batch
 * @param assetPrices Array of asset price data to insert
 * @returns Array of created price IDs or null if creation failed
 */
export const addAssetPricesBatch = async (
  assetPrices: AssetPriceData[]
): Promise<string[] | null> => {
  const results = await addAssetPricesCore(assetPrices);
  return results ? results.map((r) => r.id) : null;
};

/**
 * Fetches assets of a specific type for a user
 * @param userId The ID of the user whose assets to fetch
 * @param assetType The type of assets to fetch
 * @returns Array of assets or empty array if none found
 */
export const fetchAssetsByType = async (
  userId: string,
  assetType: string
): Promise<Asset[]> => {
  if (!userId) {
    console.error("No user ID provided to fetchAssetsByType");
    return [];
  }

  // Reuse fetchUserAssets with type filter
  return await fetchUserAssets(userId, { type: assetType });
};
