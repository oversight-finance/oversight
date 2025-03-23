/**
 * Asset type definitions that match the database schema
 */

/**
 * Common asset types as defined in database schema
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
 * Base asset interface
 */
export interface Asset {
  id: string;
  user_id: string;
  type: AssetType;
  created_at: string;
  updated_at: string;
}

/**
 * Vehicle asset interface matching vehicles table
 */
export interface Vehicle extends Asset {
  make: string;
  model: string;
  year: number;
  purchase_price?: number;
  current_value?: number;
  purchase_date?: string;
  vin?: string;
  currency: string;
}

/**
 * Real estate asset interface matching real_estate table
 */
export interface RealEstate extends Asset {
  property_type: string; // 'residential', 'commercial', 'land'
  address: string;
  purchase_price: number;
  current_value: number;
  purchase_date: string;
  mortgage_balance?: number;
  mortgage_interest_rate?: number;
  mortgage_term_years?: number;
  property_tax_annual?: number;
  currency: string;
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
    return 0;
  }

  // Sort prices by date (descending) and take the latest
  const latestPrice = [...asset.prices].sort(
    (a, b) =>
      new Date(b.price_date).getTime() - new Date(a.price_date).getTime()
  )[0];

  return latestPrice.price;
};

/**
 * Calculates the return on investment for a vehicle or real estate
 */
export const calculateROI = (asset: Vehicle | RealEstate): number | null => {
  if (asset.type === AssetType.VEHICLE) {
    const vehicle = asset as Vehicle;
    if (
      !vehicle.purchase_price ||
      !vehicle.current_value ||
      vehicle.purchase_price === 0
    ) {
      return null;
    }

    return (
      ((vehicle.current_value - vehicle.purchase_price) / vehicle.purchase_price) * 100
    );
  } else if (asset.type === AssetType.REAL_ESTATE) {
    const realEstate = asset as RealEstate;
    if (realEstate.purchase_price === 0) {
      return null;
    }

    return (
      ((realEstate.current_value - realEstate.purchase_price) / realEstate.purchase_price) * 100
    );
  }

  return null;
};
