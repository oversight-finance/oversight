/**
 * Vehicle type definitions that match the database schema
 */

/**
 * Payment method options for vehicles
 */
export enum CarPaymentMethod {
    CASH = "cash",
    LEASE = "lease",
    FINANCE = "finance",
}

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
    payment_method?: CarPaymentMethod;
    loan_amount?: number;
    loan_start_date?: string;
    loan_end_date?: string;
    interest_rate?: number;
    loan_term_months?: number;
    monthly_payment?: number;
    lease_term_months?: number;
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

/**
 * Calculates the remaining loan balance for a vehicle
 */
export const calculateRemainingLoanBalance = (vehicle: Vehicle): number | null => {
    if (
        !vehicle.loan_amount ||
        !vehicle.interest_rate ||
        !vehicle.loan_term_months ||
        !vehicle.loan_start_date ||
        vehicle.payment_method === CarPaymentMethod.CASH
    ) {
        return null;
    }

    // Calculate months elapsed since loan start
    const loanStartDate = new Date(vehicle.loan_start_date);
    const currentDate = new Date();
    const monthsElapsed = 
        (currentDate.getFullYear() - loanStartDate.getFullYear()) * 12 + 
        (currentDate.getMonth() - loanStartDate.getMonth());

    // If loan is complete, return 0
    if (monthsElapsed >= vehicle.loan_term_months) {
        return 0;
    }

    // Calculate monthly interest rate
    const monthlyInterestRate = vehicle.interest_rate / 100 / 12;
    
    // Calculate total number of payments
    const totalPayments = vehicle.loan_term_months;
    
    // Calculate monthly payment if not provided
    const payment = vehicle.monthly_payment || 
        (vehicle.loan_amount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) / 
        (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);
    
    // Calculate remaining balance
    // Formula: P[(1+r)^n - (1+r)^p]/[(1+r)^n - 1]
    // Where P = original loan amount, r = monthly interest rate, n = total months, p = months elapsed
    const remainingBalance = 
        vehicle.loan_amount * 
        (Math.pow(1 + monthlyInterestRate, totalPayments) - Math.pow(1 + monthlyInterestRate, monthsElapsed)) /
        (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);
    
    return Math.max(0, remainingBalance);
}; 