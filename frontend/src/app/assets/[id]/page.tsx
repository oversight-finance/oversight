"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAssets } from "@/contexts/AssetsContext";
import { AssetType } from "@/types/Asset";
import { Button } from "@/components/ui/button";
import {
  VehicleDetails,
  RealEstateDetails,
  StockDetails,
  CryptoDetails,
} from "./components";
import { Vehicle } from "@/types/Vehicle";
import { RealEstate } from "@/types/RealEstate";

// Union type for all possible asset types
type AssetUnion = Vehicle | RealEstate;

export default function AssetDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { assets } = useAssets();
  const [asset, setAsset] = useState<AssetUnion | null>(null);
  const router = useRouter();

  useEffect(() => {
    const foundAsset = assets.find((a) => a.id === params.id);
    if (foundAsset) {
      setAsset(foundAsset);
    }
  }, [assets, params.id]);

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h1 className="text-2xl font-bold mb-4">Asset not found</h1>
        <Button onClick={() => router.push("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  // Determine asset type
  const getAssetType = (): AssetType => {
    if ("make" in asset && "model" in asset) {
      return AssetType.VEHICLE;
    } else if ("property_type" in asset) {
      return AssetType.REAL_ESTATE;
    }
    return AssetType.STOCK; // Default fallback
  };

  const assetType = getAssetType();

  // Get a display name for the asset
  const getAssetName = (): string => {
    if ("make" in asset && "model" in asset) {
      return `${asset.year} ${asset.make} ${asset.model}`;
    } else if ("property_type" in asset) {
      return asset.address || "Real Estate Property";
    }
    return "Asset";
  };

  const renderAssetDetails = () => {
    switch (assetType) {
      case AssetType.VEHICLE:
        return <VehicleDetails asset={asset as Vehicle} />;
      case AssetType.REAL_ESTATE:
        return <RealEstateDetails realEstate={asset as RealEstate} />;
      case AssetType.STOCK:
        return <StockDetails asset={asset} />;
      case AssetType.CRYPTO:
        return <CryptoDetails asset={asset} />;
      default:
        return (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">
              Details not available for this asset type
            </p>
          </div>
        );
    }
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard")}
          className="mb-4"
        >
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">{getAssetName()}</h1>
      </div>

      {renderAssetDetails()}
    </div>
  );
}
