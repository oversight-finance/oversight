import { Asset } from "@/types/Account";

interface CryptoDetailsProps {
  asset: Asset;
}

export default function CryptoDetails({ asset }: CryptoDetailsProps) {
  return (
    <div className="flex items-center justify-center h-[300px]">
      <p className="text-muted-foreground">Cryptocurrency details coming soon</p>
    </div>
  );
} 