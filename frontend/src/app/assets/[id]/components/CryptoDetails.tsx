import { Vehicle } from "@/types/Vehicle";
import { RealEstate } from "@/types/RealEstate";

// Generic asset type since we don't have a specific Crypto type yet
type GenericAsset = Vehicle | RealEstate;

interface CryptoDetailsProps {
  asset: GenericAsset;
}

export default function CryptoDetails({ asset }: CryptoDetailsProps) {
  return (
    <div className="flex items-center justify-center h-[300px]">
      <p className="text-muted-foreground">
        Cryptocurrency details coming soon
      </p>
    </div>
  );
}
