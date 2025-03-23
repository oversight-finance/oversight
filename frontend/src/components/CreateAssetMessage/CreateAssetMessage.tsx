import { useAccounts } from "@/contexts/AccountsContext";
import { useAssets } from "@/contexts/AssetsContext";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useState } from "react";
import { AssetType } from "@/types/Asset";
import { AccountType } from "@/types/Account";
import VehicleForm from "@/components/Assets/VehicleForm";
import RealEstateForm from "@/components/Assets/RealEstateForm";
import BankForm from "@/components/LinkedAccounts/BankForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Car, Building2, Home, Coins, CircleDollarSign } from "lucide-react";

type DialogState = {
  isOpen: boolean;
  type: "account" | "asset";
  subtype: AccountType | AssetType;
  step: "select" | "form";
};

const assetTypeIcons = {
  [AssetType.CRYPTO]: <Coins className="h-4 w-4" />,
  [AssetType.STOCK]: <CircleDollarSign className="h-4 w-4" />,
  [AssetType.REAL_ESTATE]: <Home className="h-4 w-4" />,
  [AssetType.VEHICLE]: <Car className="h-4 w-4" />,
};

const accountTypeIcons: Record<AccountType, React.ReactNode> = {
  [AccountType.BANK]: <Building2 className="h-4 w-4" />,
  [AccountType.INVESTMENT]: <Coins className="h-4 w-4" />,
  [AccountType.CREDIT]: <CircleDollarSign className="h-4 w-4" />,
  [AccountType.CRYPTO]: <Coins className="h-4 w-4" />,
  [AccountType.SAVINGS]: <Building2 className="h-4 w-4" />,
  [AccountType.STOCK]: <CircleDollarSign className="h-4 w-4" />,
  [AccountType.REAL_ESTATE]: <Home className="h-4 w-4" />,
  [AccountType.VEHICLE]: <Car className="h-4 w-4" />,
};

const assetTypeLabels = {
  [AssetType.CRYPTO]: "Cryptocurrency",
  [AssetType.STOCK]: "Stock",
  [AssetType.REAL_ESTATE]: "Real Estate",
  [AssetType.VEHICLE]: "Vehicle",
};

// Create account type labels dynamically from enum
const accountTypeLabels: Record<AccountType, string> = Object.values(
  AccountType
).reduce((acc, type) => {
  // Convert type from snake_case to Title Case
  const label =
    type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ") + " Account";

  acc[type] = label;
  return acc;
}, {} as Record<AccountType, string>);

export default function CreateAssetMessage() {
  const { accounts } = useAccounts();
  const { assets } = useAssets();
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    type: "asset",
    subtype: AssetType.VEHICLE,
    step: "select",
  });

  const handleTypeChange = (value: string) => {
    if (value === "account") {
      setDialogState((prev) => ({
        ...prev,
        type: "account",
        subtype: AccountType.BANK,
      }));
    } else {
      setDialogState((prev) => ({
        ...prev,
        type: "asset",
        subtype: AssetType.VEHICLE,
      }));
    }
  };

  const handleSubtypeChange = (value: string) => {
    if (dialogState.type === "asset") {
      setDialogState((prev) => ({
        ...prev,
        subtype: value as AssetType,
      }));
    } else {
      setDialogState((prev) => ({
        ...prev,
        subtype: value as AccountType,
      }));
    }
  };

  const handleContinue = () => {
    setDialogState((prev) => ({
      ...prev,
      step: "form",
    }));
  };

  const handleBack = () => {
    setDialogState((prev) => ({
      ...prev,
      step: "select",
    }));
  };

  const renderTypeSelector = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="assetType" className="text-sm font-medium">
            Asset Type
          </label>
          <Select value={dialogState.type} onValueChange={handleTypeChange}>
            <SelectTrigger id="assetType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asset">Asset</SelectItem>
              <SelectItem value="account">Account</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="assetSubtype" className="text-sm font-medium">
            {dialogState.type === "asset"
              ? "Asset Category"
              : "Account Category"}
          </label>
          <Select
            value={dialogState.subtype}
            onValueChange={handleSubtypeChange}
          >
            <SelectTrigger id="assetSubtype">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {dialogState.type === "asset"
                ? Object.values(AssetType).map((type: AssetType) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {assetTypeIcons[type]}
                        <span>{assetTypeLabels[type]}</span>
                      </div>
                    </SelectItem>
                  ))
                : Object.values(AccountType)
                    // Filter to only show the main account types for better UX
                    .filter((type) =>
                      [
                        AccountType.BANK,
                        AccountType.INVESTMENT,
                        AccountType.CREDIT,
                      ].includes(type)
                    )
                    .map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {accountTypeIcons[type]}
                          <span>{accountTypeLabels[type]}</span>
                        </div>
                      </SelectItem>
                    ))}
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    );
  };

  const renderForm = () => {
    if (dialogState.type === "asset") {
      switch (dialogState.subtype as AssetType) {
        case AssetType.VEHICLE:
          return (
            <>
              <Button variant="outline" onClick={handleBack} className="mb-4">
                Back to Selection
              </Button>
              <VehicleForm />
            </>
          );
        case AssetType.REAL_ESTATE:
          return (
            <>
              <Button variant="outline" onClick={handleBack} className="mb-4">
                Back to Selection
              </Button>
              <RealEstateForm />
            </>
          );
        default:
          return (
            <>
              <Button variant="outline" onClick={handleBack} className="mb-4">
                Back to Selection
              </Button>
              <div className="p-4 text-center text-muted-foreground">
                <p>This asset type is not yet implemented.</p>
              </div>
            </>
          );
      }
    } else {
      switch (dialogState.subtype as AccountType) {
        case AccountType.BANK:
          return (
            <>
              <Button variant="outline" onClick={handleBack} className="mb-4">
                Back to Selection
              </Button>
              <BankForm />
            </>
          );
        default:
          return (
            <>
              <Button variant="outline" onClick={handleBack} className="mb-4">
                Back to Selection
              </Button>
              <div className="p-4 text-center text-muted-foreground">
                <p>This account type is not yet implemented.</p>
              </div>
            </>
          );
      }
    }
  };

  // Show the message if there are no accounts and no assets
  if (accounts.length === 3 && assets.length === 0) {
    return (
      <Dialog
        open={dialogState.isOpen}
        onOpenChange={(open) =>
          setDialogState((prev) => ({ ...prev, isOpen: open, step: "select" }))
        }
      >
        <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg border-muted">
          <PlusCircle className="w-12 h-12 mb-4 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No Assets Added</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Add your first asset to start tracking your wealth
          </p>
          <DialogTrigger asChild>
            <Button
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  type: "asset",
                  subtype: AssetType.VEHICLE,
                  step: "select",
                })
              }
            >
              Add Your First Asset
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden p-8">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl">
              {dialogState.step === "select"
                ? "Select Asset Type"
                : dialogState.type === "asset"
                ? `Add New ${assetTypeLabels[dialogState.subtype as AssetType]}`
                : `Add New ${
                    accountTypeLabels[dialogState.subtype as AccountType]
                  }`}
            </DialogTitle>
          </DialogHeader>
          <div className="px-1">
            {dialogState.step === "select"
              ? renderTypeSelector()
              : renderForm()}
          </div>
          <DialogClose data-dialog-close className="hidden" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={dialogState.isOpen}
      onOpenChange={(open) =>
        setDialogState((prev) => ({ ...prev, isOpen: open, step: "select" }))
      }
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() =>
            setDialogState({
              isOpen: true,
              type: "asset",
              subtype: AssetType.VEHICLE,
              step: "select",
            })
          }
        >
          <PlusCircle className="w-4 h-4" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden p-8">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl">
            {dialogState.step === "select"
              ? "Select Asset Type"
              : dialogState.type === "asset"
              ? `Add New ${assetTypeLabels[dialogState.subtype as AssetType]}`
              : `Add New ${
                  accountTypeLabels[dialogState.subtype as AccountType]
                }`}
          </DialogTitle>
        </DialogHeader>
        <div className="px-1">
          {dialogState.step === "select" ? renderTypeSelector() : renderForm()}
        </div>
        <DialogClose data-dialog-close className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
