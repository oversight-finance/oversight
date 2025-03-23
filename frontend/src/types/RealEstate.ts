/**
 * Real Estate type definitions that match the database schema
 */

/**
 * Represents a real estate record from the real_estate table
 */
export interface RealEstate {
    id: string;
    user_id: string;
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
    created_at: string;
    updated_at: string;
}

/**
 * Represents a real estate price record from the real_estate_prices table
 */
export interface RealEstatePrice {
    id: string;
    real_estate_id: string;
    price_date: string;
    price: number;
    recorded_at: string;
}

/**
 * Extended real estate with price history for UI
 */
export interface RealEstateWithPrices extends RealEstate {
    prices: RealEstatePrice[];
}

/**
 * Calculates the return on investment for a real estate property
 */
export const calculateRealEstateROI = (realEstate: RealEstate): number | null => {
    if (realEstate.purchase_price === 0) {
        return null;
    }

    return (
        ((realEstate.current_value - realEstate.purchase_price) / realEstate.purchase_price) * 100
    );
}; 