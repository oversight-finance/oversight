import { Asset } from "@/types/Account";

interface StockDetailsProps {
  asset: Asset;
}

export default function StockDetails({ asset }: StockDetailsProps) {
  return (
    <div className="flex items-center justify-center h-[300px]">
      <p className="text-muted-foreground">Stock details coming soon</p>
    </div>
  );
}
