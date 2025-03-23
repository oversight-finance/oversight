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
  const { getUserId } = useAuth(); // Get the getUserId method from AuthContext
  const userId = getUserId();
  // Fetch assets on mount
  useEffect(() => {
    refreshAssets();
  }, [userId]);

  const refreshAssets = async () => {
    setIsLoading(true);
    try {
      if (!userId) {
        console.error("No user ID available");
        setAssets([]);
        return;
      }

      // Fetch both types of assets
      const [vehicles, realEstateProperties] = await Promise.all([
        fetchUserVehicles(userId),
        fetchUserRealEstate(userId),
      ]);

      // If there are no assets in the database, add the default ones
      if (vehicles.length === 0 && realEstateProperties.length === 0) {
        // setAssets([defaultVehicle, defaultRealEstate]);
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
