"use client";

import { createContext, useContext, useState } from "react";
import { Asset, AssetType } from "../types/Account";

// Calculate current value based on purchase price, date, and rate (appreciation or depreciation)
const calculateCurrentValue = (
  purchasePrice: number,
  purchaseDate: string,
  rate: number,
  isDepreciation: boolean = false
): number => {
  if (!purchasePrice || !purchaseDate) return purchasePrice;
  
  const purchaseDateTime = new Date(purchaseDate).getTime();
  const currentDateTime = new Date().getTime();
  
  // Calculate years elapsed (including partial years)
  const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25;
  const yearsElapsed = (currentDateTime - purchaseDateTime) / millisecondsPerYear;
  
  // If the purchase date is in the future, return the purchase price
  if (yearsElapsed < 0) return purchasePrice;
  
  // Calculate current value using compound formula
  // For depreciation, we use (1 - rate/100), for appreciation we use (1 + rate/100)
  const factor = isDepreciation ? (1 - (rate / 100)) : (1 + (rate / 100));
  const currentValue = purchasePrice * Math.pow(factor, yearsElapsed);
  
  // Round to 2 decimal places
  return Math.round(currentValue * 100) / 100;
};

// Default vehicle asset that will always be present
const vehiclePurchaseDate = "2022-06-15";
const vehiclePurchaseValue = 25000;
const vehicleDepreciationRate = 15;

const defaultVehicle: Asset = {
  id: "default-vehicle-asset",
  userId: "default-user",
  type: AssetType.VEHICLE,
  name: "Toyota Camry",
  purchaseValue: vehiclePurchaseValue,
  currentValue: calculateCurrentValue(vehiclePurchaseValue, vehiclePurchaseDate, vehicleDepreciationRate, true),
  purchaseDate: vehiclePurchaseDate,
  createdAt: vehiclePurchaseDate,
  metadata: {
    make: "Toyota",
    model: "Camry",
    year: 2022,
    color: "Silver",
    mileage: 15000,
    vin: "1HGCM82633A123456",
    licensePlate: "ABC-1234",
    depreciationRate: vehicleDepreciationRate,
    financingType: "finance",
    interestRate: 4.5,
    monthlyPayment: 450,
    loanTerm: 60
  },
  prices: []
};

// Default real estate asset that will always be present
const realEstatePurchaseDate = "2021-03-10";
const realEstatePurchaseValue = 350000;
const realEstateAppreciationRate = 3.5;

const defaultRealEstate: Asset = {
  id: "default-real-estate-asset",
  userId: "default-user",
  type: AssetType.REAL_ESTATE,
  name: "Main Street Property",
  purchaseValue: realEstatePurchaseValue,
  currentValue: calculateCurrentValue(realEstatePurchaseValue, realEstatePurchaseDate, realEstateAppreciationRate),
  purchaseDate: realEstatePurchaseDate,
  createdAt: realEstatePurchaseDate,
  metadata: {
    propertyType: "single_family",
    address: {
      street: "123 Main Street",
      city: "Springfield",
      state: "IL",
      zipCode: "62704",
      country: "USA"
    },
    squareFeet: 2200,
    bedrooms: 4,
    bathrooms: 2.5,
    yearBuilt: 2005,
    lotSize: 0.25,
    propertyTax: 4200,
    insuranceCost: 1800,
    maintenanceCost: 3000,
    rentalIncome: 2500,
    financingType: "mortgage",
    interestRate: 3.25,
    monthlyPayment: 1520,
    loanTerm: 360,
    appreciationRate: realEstateAppreciationRate
  },
  prices: []
};

interface AssetsContextType {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, "id" | "createdAt" | "prices">) => string;
  removeAsset: (id: string) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
}

const AssetsContext = createContext<AssetsContextType | null>(null);

export function AssetsProvider({ children }: { children: React.ReactNode }) {
  // Initialize with the default assets
  const [assets, setAssets] = useState<Asset[]>([defaultVehicle, defaultRealEstate]);

  const addAsset = (newAsset: Omit<Asset, "id" | "createdAt" | "prices">) => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    
    const asset = {
      ...newAsset,
      id,
      createdAt: now,
      prices: [],
    };

    setAssets((current) => [...current, asset]);
    console.log("add asset", assets);
    
    return id;
  };

  const removeAsset = (id: string) => {
    // Don't allow removing the default assets
    if (id === defaultVehicle.id || id === defaultRealEstate.id) return;
    
    setAssets((current) => current.filter((asset) => asset.id !== id));
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    setAssets((current) =>
      current.map((asset) =>
        asset.id === id ? { ...asset, ...updates } : asset
      )
    );
  };

  return (
    <AssetsContext.Provider
      value={{ assets, addAsset, removeAsset, updateAsset }}
    >
      {children}
    </AssetsContext.Provider>
  );
}

export function useAssets() {
  const context = useContext(AssetsContext);
  if (!context) {
    throw new Error("useAssets must be used within an AssetsProvider");
  }
  return context;
} 