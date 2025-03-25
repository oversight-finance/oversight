"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAssets } from "@/contexts/AssetsContext";
import { AssetType } from "@/types/Asset";
import { Button } from "@/components/ui/button";
import { VehicleDetails, RealEstateDetails } from "./components";
import { Vehicle } from "@/types/Vehicle";
import { RealEstate } from "@/types/RealEstate";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Union type for all possible asset types
type AssetUnion = Vehicle | RealEstate;

export default function AssetDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { assets, isLoading } = useAssets();
  const [asset, setAsset] = useState<AssetUnion | null>(null);
  const router = useRouter();

  useEffect(() => {
    const foundAsset = assets.find((a) => a.id === params.id);
    if (foundAsset) {
      setAsset(foundAsset);
    }
  }, [assets, params.id]);

  if (isLoading || !asset) {
    return (
      <div className="container space-y-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
        </div>

        <div className="space-y-4">
          {/* First row: Info cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-none">
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-5 w-36 mb-2" />
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-2">
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-64" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-5 w-36 mb-2" />
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second row: Charts and data skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-none">
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-5 w-36 mb-2" />
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex items-center justify-center h-60">
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Loading asset data...
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none flex flex-col">
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-5 w-36 mb-2" />
              </CardHeader>
              <CardContent className="flex-1 p-4 pt-2">
                <div className="h-[300px] w-full">
                  <Skeleton className="h-full w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
    throw new Error("Invalid asset type");
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
    <div className="container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{getAssetName()}</h1>
      </div>

      {renderAssetDetails()}
    </div>
  );
}
