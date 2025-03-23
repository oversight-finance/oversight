"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Vehicle } from "../types/Vehicle";
import { RealEstate } from "../types/RealEstate";
import { AssetType } from "../types/Asset";
import { 
  fetchUserVehicles, 
  createVehicle, 
  updateVehicle, 
  deleteVehicle 
} from "@/database/Vehicles";
import {
  fetchUserRealEstate,
  createRealEstate,
  updateRealEstate,
  deleteRealEstate
} from "@/database/RealEstate";

// Define a type that represents either a Vehicle or RealEstate
export type Asset = Vehicle | RealEstate;

// Helper to determine if an asset is a Vehicle
const isVehicle = (asset: Asset): asset is Vehicle => {
  return 'make' in asset && 'model' in asset;
};

// Helper to determine if an asset is Real Estate
const isRealEstate = (asset: Asset): asset is RealEstate => {
  return 'property_type' in asset && 'address' in asset;
};

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
  const yearsElapsed =
    (currentDateTime - purchaseDateTime) / millisecondsPerYear;

  // If the purchase date is in the future, return the purchase price
  if (yearsElapsed < 0) return purchasePrice;

  // Calculate current value using compound formula
  // For depreciation, we use (1 - rate/100), for appreciation we use (1 + rate/100)
  const factor = isDepreciation ? 1 - rate / 100 : 1 + rate / 100;
  const currentValue = purchasePrice * Math.pow(factor, yearsElapsed);

  // Round to 2 decimal places
  return Math.round(currentValue * 100) / 100;
};

// Default vehicle asset that will always be present
const vehiclePurchaseDate = "2022-06-15";
const vehiclePurchaseValue = 25000;
const vehicleDepreciationRate = 15;

const defaultVehicle: Vehicle = {
  id: "default-vehicle-asset",
  user_id: "default-user",
  make: "Toyota",
  model: "Camry",
  year: 2022,
  purchase_price: vehiclePurchaseValue,
  current_value: calculateCurrentValue(
    vehiclePurchaseValue,
    vehiclePurchaseDate,
    vehicleDepreciationRate,
    true
  ),
  purchase_date: vehiclePurchaseDate,
  vin: "1HGCM82633A123456",
  currency: "USD",
  created_at: vehiclePurchaseDate,
  updated_at: vehiclePurchaseDate,
};

// Default real estate asset that will always be present
const realEstatePurchaseDate = "2021-03-10";
const realEstatePurchaseValue = 350000;
const realEstateAppreciationRate = 3.5;

const defaultRealEstate: RealEstate = {
  id: "default-real-estate-asset",
  user_id: "default-user",
  property_type: "Single Family",
  address: "123 Main Street, Springfield, IL 62704, USA",
  purchase_price: realEstatePurchaseValue,
  current_value: calculateCurrentValue(
    realEstatePurchaseValue,
    realEstatePurchaseDate,
    realEstateAppreciationRate
  ),
  purchase_date: realEstatePurchaseDate,
  mortgage_balance: 300000,
  mortgage_interest_rate: 3.25,
  mortgage_term_years: 30,
  property_tax_annual: 4200,
  currency: "USD",
  created_at: realEstatePurchaseDate,
  updated_at: realEstatePurchaseDate,
};

interface AssetsContextType {
  assets: Asset[];
  isLoading: boolean;
  addAsset: (asset: Vehicle | RealEstate) => Promise<string | null>;
  removeAsset: (id: string) => Promise<boolean>;
  updateAsset: (id: string, updates: Partial<Vehicle | RealEstate>) => Promise<boolean>;
  refreshAssets: () => Promise<void>;
}

const AssetsContext = createContext<AssetsContextType | null>(null);

export function AssetsProvider({ children }: { children: React.ReactNode }) {
  // Initialize with default assets
  const [assets, setAssets] = useState<Asset[]>([
    defaultVehicle,
    defaultRealEstate,
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const userId = "default-user"; // In a real app, this would come from auth

  // Fetch assets on mount
  useEffect(() => {
    refreshAssets();
  }, []);

  const refreshAssets = async () => {
    setIsLoading(true);
    try {
      // Fetch both types of assets
      const [vehicles, realEstateProperties] = await Promise.all([
        fetchUserVehicles(userId),
        fetchUserRealEstate(userId)
      ]);

      // If there are no assets in the database, add the default ones
      if (vehicles.length === 0 && realEstateProperties.length === 0) {
        setAssets([defaultVehicle, defaultRealEstate]);
      } else {
        // Combine all assets
        const allAssets: Asset[] = [...vehicles, ...realEstateProperties];
        setAssets(allAssets);
      }
    } catch (error) {
      console.error("Error refreshing assets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addAsset = async (newAsset: Vehicle | RealEstate): Promise<string | null> => {
    try {
      let id: string | null = null;
      
      // Determine asset type and use appropriate database function
      if (isVehicle(newAsset)) {
        const { id: _, created_at, updated_at, ...vehicleData } = newAsset;
        id = await createVehicle(vehicleData);
      } else if (isRealEstate(newAsset)) {
        const { id: _, created_at, updated_at, ...realEstateData } = newAsset;
        id = await createRealEstate(realEstateData);
      }

      if (id) {
        // Refresh assets to get the updated list
        await refreshAssets();
        return id;
      }
      return null;
    } catch (error) {
      console.error("Error adding asset:", error);
      return null;
    }
  };

  const removeAsset = async (id: string): Promise<boolean> => {
    // Don't allow removing the default assets
    if (id === defaultVehicle.id || id === defaultRealEstate.id) {
      return false;
    }

    try {
      // Find the asset to determine its type
      const asset = assets.find(a => a.id === id);
      let success = false;

      if (asset) {
        if (isVehicle(asset)) {
          success = await deleteVehicle(id);
        } else if (isRealEstate(asset)) {
          success = await deleteRealEstate(id);
        }

        if (success) {
          // Refresh assets to get the updated list
          await refreshAssets();
        }
      }

      return success;
    } catch (error) {
      console.error("Error removing asset:", error);
      return false;
    }
  };

  const updateAsset = async (id: string, updates: Partial<Vehicle | RealEstate>): Promise<boolean> => {
    try {
      // Find the asset to determine its type
      const asset = assets.find(a => a.id === id);
      let success = false;

      if (asset) {
        if (isVehicle(asset)) {
          // Ensure we're only updating valid fields for Vehicle
          const { id: _, created_at, updated_at, ...validUpdates } = updates as Partial<Vehicle>;
          success = await updateVehicle(id, validUpdates);
        } else if (isRealEstate(asset)) {
          // Ensure we're only updating valid fields for RealEstate
          const { id: _, created_at, updated_at, ...validUpdates } = updates as Partial<RealEstate>;
          success = await updateRealEstate(id, validUpdates);
        }

        if (success) {
          // Refresh assets to get the updated list
          await refreshAssets();
        }
      }

      return success;
    } catch (error) {
      console.error("Error updating asset:", error);
      return false;
    }
  };

  return (
    <AssetsContext.Provider
      value={{ assets, isLoading, addAsset, removeAsset, updateAsset, refreshAssets }}
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
