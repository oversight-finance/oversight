/**
 * Vehicle type definitions that match the database schema
 */

/**
 * Represents a vehicle record from the vehicles table
 */
export interface Vehicle {
    id: string;
    user_id: string;
    make: string;
    model: string;
    year: number;
    purchase_price?: number;
    current_value?: number;
    purchase_date?: string;
    vin?: string;
    currency: string;
    created_at: string;
    updated_at: string;
}

/**
 * Represents a vehicle price record from the vehicle_prices table
 */
export interface VehiclePrice {
    id: string;
    vehicle_id: string;
    price_date: string;
    price: number;
    recorded_at: string;
}

/**
 * Extended vehicle with price history for UI
 */
export interface VehicleWithPrices extends Vehicle {
    prices: VehiclePrice[];
}

/**
 * Calculates the return on investment for a vehicle
 */
export const calculateVehicleROI = (vehicle: Vehicle): number | null => {
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
}; 