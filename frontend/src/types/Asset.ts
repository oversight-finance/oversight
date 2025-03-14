/**
 * Asset type definitions that match the database schema
 */

/**
 * Common asset types as defined in database schema comments
 */
export enum AssetType {
  CRYPTO = "crypto",
  STOCK = "stock",
  REAL_ESTATE = "real_estate",
  VEHICLE = "vehicle",
}

/**
 * Asset metadata type with specific fields
 */
export type AssetMetadata = {
  [key: string]: string | number | boolean | null | object | Record<string, any>;
};

/**
 * Represents an asset as defined in the assets table
 */
export interface Asset {
  id: string;
  user_id: string;
  type: string;
  name: string;
  purchase_value?: number;
  current_value?: number;
  purchase_date?: string;
  metadata?: AssetMetadata;
  created_at: string;
}

/**
 * Represents an asset price record as defined in the asset_prices table
 */
export interface AssetPrice {
  id: string;
  asset_id: string;
  price_date: string;
  price: number;
  recorded_at: string;
}

/**
 * Extended asset with price history for UI
 */
export interface AssetWithPrices extends Asset {
  prices: AssetPrice[];
}

/**
 * Calculates the current value of an asset based on the latest price
 */
export const calculateCurrentValue = (asset: AssetWithPrices): number => {
  if (asset.prices.length === 0) {
    return asset.purchase_value || 0;
  }

  // Sort prices by date (descending) and take the latest
  const latestPrice = [...asset.prices].sort(
    (a, b) =>
      new Date(b.price_date).getTime() - new Date(a.price_date).getTime()
  )[0];

  return latestPrice.price;
};

/**
 * Calculates the return on investment for an asset
 */
export const calculateROI = (asset: Asset): number | null => {
  if (
    !asset.purchase_value ||
    !asset.current_value ||
    asset.purchase_value === 0
  ) {
    return null;
  }

  return (
    ((asset.current_value - asset.purchase_value) / asset.purchase_value) * 100
  );
};
