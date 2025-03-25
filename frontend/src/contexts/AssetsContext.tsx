"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Vehicle } from "../types/Vehicle";
import { RealEstate } from "../types/RealEstate";
import { AssetType } from "../types/Asset";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchUserVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/database/Vehicles";
import {
  fetchUserRealEstate,
  createRealEstate,
  updateRealEstate,
  deleteRealEstate,
} from "@/database/RealEstate";
import { setErrorMap } from "zod";

// Define a type that represents either a Vehicle or RealEstate
export type Asset = Vehicle | RealEstate;

// Helper to determine if an asset is a Vehicle
const isVehicle = (asset: Asset): asset is Vehicle => {
  return "make" in asset && "model" in asset;
};

// Helper to determine if an asset is Real Estate
const isRealEstate = (asset: Asset): asset is RealEstate => {
  return "property_type" in asset && "address" in asset;
};

// Calculate current value based on purchase price, date, and annual growth rate
// This uses a month-by-month calculation with the monthly rate
const calculateCurrentValue = (
  purchasePrice: number,
  purchaseDate: string,
  annualGrowthRate: number
): number => {
  if (!purchasePrice || !purchaseDate) return purchasePrice;

  // Convert annual growth rate to monthly rate
  const monthlyRate = annualGrowthRate / 12 / 100;

  // Get start and end dates
  const startDate = new Date(purchaseDate);
  const currentDate = new Date();

  // If purchase date is in the future, return the purchase price
  if (startDate > currentDate) return purchasePrice;

  // Calculate total months between purchase date and now
  const totalMonths =
    (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
    (currentDate.getMonth() - startDate.getMonth());

  // Apply compound growth/depreciation month by month
  let currentValue = purchasePrice;
  for (let i = 0; i < totalMonths; i++) {
    currentValue = currentValue * (1 + monthlyRate);
  }

  // Round to 2 decimal places
  return Math.round(currentValue * 100) / 100;
};

interface AssetsContextType {
  assets: Asset[];
  isLoading: boolean;
  addAsset: (asset: Vehicle | RealEstate) => Promise<string | null>;
  removeAsset: (id: string) => Promise<boolean>;
  updateAsset: (
    id: string,
    updates: Partial<Vehicle | RealEstate>
  ) => Promise<boolean>;
  refreshAssets: () => Promise<void>;
}

const AssetsContext = createContext<AssetsContextType | null>(null);

export function AssetsProvider({ children }: { children: React.ReactNode }) {
  // Initialize with default assets
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getUserId, isLoading: isAuthLoading } = useAuth(); // Get the getUserId method from AuthContext
  const userId = getUserId(); // Store userId as a variable

  // Fetch assets on mount and when userId changes
  useEffect(() => {
    refreshAssets();
  }, [userId]);

  const refreshAssets = async () => {
    setIsLoading(true);
    try {
      // Wait for auth context to be ready
      if (isAuthLoading) {
        return;
      }
      if (!userId) {
        setAssets([]);
        return;
      }

      // Fetch both types of assets
      const [vehicles, realEstateProperties] = await Promise.all([
        fetchUserVehicles(userId),
        fetchUserRealEstate(userId),
      ]);

      // Calculate current values for all assets
      const vehiclesWithCurrentValue = vehicles.map((vehicle) => {
        // Use annual_growth_rate or default to -15% for vehicles (depreciation)
        const growthRate =
          vehicle.annual_growth_rate !== undefined
            ? vehicle.annual_growth_rate
            : -15;

        return {
          ...vehicle,
          current_value: calculateCurrentValue(
            vehicle.purchase_price || 0,
            vehicle.purchase_date || new Date().toISOString(),
            growthRate
          ),
        };
      });

      const realEstateWithCurrentValue = realEstateProperties.map(
        (property) => {
          // Use annual_growth_rate or default to 3% for real estate (appreciation)
          const growthRate =
            property.annual_growth_rate !== undefined
              ? property.annual_growth_rate
              : 3;

          return {
            ...property,
            current_value: calculateCurrentValue(
              property.purchase_price || 0,
              property.purchase_date || new Date().toISOString(),
              growthRate
            ),
          };
        }
      );

      // Combine all assets
      const allAssets: Asset[] = [
        ...vehiclesWithCurrentValue,
        ...realEstateWithCurrentValue,
      ];

      setAssets(allAssets);
    } catch (error) {
      console.error("Error refreshing assets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addAsset = async (
    newAsset: Vehicle | RealEstate
  ): Promise<string | null> => {
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
    try {
      // Find the asset to determine its type
      const asset = assets.find((a) => a.id === id);
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

  const updateAsset = async (
    id: string,
    updates: Partial<Vehicle | RealEstate>
  ): Promise<boolean> => {
    try {
      // Find the asset to determine its type
      const asset = assets.find((a) => a.id === id);
      let success = false;

      if (asset) {
        if (isVehicle(asset)) {
          // Ensure we're only updating valid fields for Vehicle
          const {
            id: _,
            created_at,
            updated_at,
            ...validUpdates
          } = updates as Partial<Vehicle>;
          success = await updateVehicle(id, validUpdates);
        } else if (isRealEstate(asset)) {
          // Ensure we're only updating valid fields for RealEstate
          const {
            id: _,
            created_at,
            updated_at,
            ...validUpdates
          } = updates as Partial<RealEstate>;
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
      value={{
        assets,
        isLoading,
        addAsset,
        removeAsset,
        updateAsset,
        refreshAssets,
      }}
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
