import { Vehicle } from "@/types/Vehicle";
import { RealEstate } from "@/types/RealEstate";

// Generic asset type since we don't have a specific Stock type yet
type GenericAsset = Vehicle | RealEstate;

interface StockDetailsProps {
  asset: GenericAsset;
}

export default function StockDetails({ asset }: StockDetailsProps) {
  return (
    <div className="flex items-center justify-center h-[300px]">
      <p className="text-muted-foreground">Stock details coming soon</p>
    </div>
  );
}
