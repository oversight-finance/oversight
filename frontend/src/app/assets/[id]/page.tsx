"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAssets } from "@/contexts/AssetsContext";
import { Asset, AssetType } from "@/types/Account";
import { Button } from "@/components/ui/button";
import {
  VehicleDetails,
  RealEstateDetails,
  StockDetails,
  CryptoDetails,
} from "./components";

export default function AssetDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { assets } = useAssets();
  const [asset, setAsset] = useState<Asset | null>(null);
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

  const renderAssetDetails = () => {
    switch (asset.type) {
      case AssetType.VEHICLE:
        return <VehicleDetails asset={asset} />;
      case AssetType.REAL_ESTATE:
        return <RealEstateDetails asset={asset} />;
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
        <h1 className="text-2xl font-bold">{asset.name}</h1>
      </div>

      {renderAssetDetails()}
    </div>
  );
}
