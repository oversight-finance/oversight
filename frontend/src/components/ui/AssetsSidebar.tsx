"use client";

import { useAssets } from "@/contexts/AssetsContext";
import { useAccounts } from "@/contexts/AccountsContext";
import { AssetType, AccountType } from "@/types/Account";
import {
  PlusCircle,
  Coins,
  Home,
  Car,
  CircleDollarSign,
  Building2,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "./sidebar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatTotalAmount } from "@/lib/utils";
import VehicleForm from "@/components/Assets/VehicleForm";
import RealEstateForm from "@/components/Assets/RealEstateForm";
import BankForm from "@/components/LinkedAccounts/BankForm";

const assetTypeIcons = {
  [AssetType.CRYPTO]: <Coins className="h-4 w-4" />,
  [AssetType.STOCK]: <CircleDollarSign className="h-4 w-4" />,
  [AssetType.REAL_ESTATE]: <Home className="h-4 w-4" />,
  [AssetType.VEHICLE]: <Car className="h-4 w-4" />,
};

const accountTypeIcons = {
  [AccountType.BANK]: <Building2 className="h-4 w-4" />,
  [AccountType.INVESTMENT]: <Coins className="h-4 w-4" />,
  [AccountType.OTHER]: <CircleDollarSign className="h-4 w-4" />,
};

const assetTypeLabels = {
  [AssetType.CRYPTO]: "Cryptocurrencies",
  [AssetType.STOCK]: "Stocks",
  [AssetType.REAL_ESTATE]: "Real Estate",
  [AssetType.VEHICLE]: "Vehicles",
};

const accountTypeLabels = {
  [AccountType.BANK]: "Bank Accounts",
  [AccountType.INVESTMENT]: "Investment Accounts",
  [AccountType.OTHER]: "Other Accounts",
};

type DialogState = {
  isOpen: boolean;
  type: 'account' | 'asset';
  subtype: AccountType | AssetType;
};

export function AssetsSidebar() {
  const { assets } = useAssets();
  const { accounts } = useAccounts();
  const router = useRouter();
  const [openSections, setOpenSections] = useState<(AccountType | AssetType)[]>([]);
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    type: 'account',
    subtype: AccountType.BANK
  });

  const toggleSection = (type: AccountType | AssetType) => {
    setOpenSections((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleAddAsset = (type: AssetType) => {
    setDialogState({
      isOpen: true,
      type: 'asset',
      subtype: type
    });
  };

  const handleAddAccount = (type: AccountType) => {
    setDialogState({
      isOpen: true,
      type: 'account',
      subtype: type
    });
  };

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  const groupedAssets = Object.values(AssetType).reduce((acc, type) => {
    acc[type] = assets.filter((asset) => asset.type === type);
    return acc;
  }, {} as Record<AssetType, typeof assets>);

  const groupedAccounts = Object.values(AccountType).reduce((acc, type) => {
    acc[type] = accounts.filter((account) => account.accountType === type);
    return acc;
  }, {} as Record<AccountType, typeof accounts>);

  // Function to render the appropriate form based on asset/account type
  const renderForm = () => {
    if (dialogState.type === 'asset') {
      switch (dialogState.subtype as AssetType) {
        case AssetType.VEHICLE:
          return <VehicleForm />;
        case AssetType.REAL_ESTATE:
          return <RealEstateForm />;
        // Add other asset type forms here as they are implemented
        default:
          return (
            <div className="p-4 text-center text-muted-foreground">
              <p>This asset type is not yet implemented.</p>
            </div>
          );
      }
    } else {
      switch (dialogState.subtype as AccountType) {
        case AccountType.BANK:
          return <BankForm />;
        // Add other account type forms here as they are implemented
        default:
          return (
            <div className="p-4 text-center text-muted-foreground">
              <p>This account type is not yet implemented.</p>
            </div>
          );
      }
    }
  };

  const getDialogTitle = () => {
    if (dialogState.type === 'asset') {
      const type = dialogState.subtype as AssetType;
      return `Add New ${assetTypeLabels[type].slice(0, -1)}`;
    } else {
      const type = dialogState.subtype as AccountType;
      return `Add New ${accountTypeLabels[type].slice(0, -1)}`;
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton className="font-semibold">
            Assets
          </SidebarMenuButton>
        </SidebarMenuItem>
        
        {/* Bank Accounts Section */}
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => toggleSection(AccountType.BANK)}
            className="justify-between"
          >
            <div className="flex items-center gap-2">
              {accountTypeIcons[AccountType.BANK]}
              <span>{accountTypeLabels[AccountType.BANK]}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {groupedAccounts[AccountType.BANK].length}
            </span>
          </SidebarMenuButton>

          {openSections.includes(AccountType.BANK) && (
            <SidebarMenuSub>
              {groupedAccounts[AccountType.BANK].length === 0 ? (
                <SidebarMenuSubButton
                  onClick={() => handleAddAccount(AccountType.BANK)}
                  className="italic text-muted-foreground"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Bank Account</span>
                </SidebarMenuSubButton>
              ) : (
                <>
                  {groupedAccounts[AccountType.BANK].map((account) => (
                    <SidebarMenuSubButton
                      key={account.id}
                      onClick={() => router.push(`/accounts/${account.id}`)}
                      className="py-2 h-auto"
                    >
                      <div className="flex flex-col items-start gap-1 w-full">
                        <span className="leading-none">{account.bankName}</span>
                        <span className="text-xs text-muted-foreground leading-none">
                          {formatTotalAmount(account.balance)}
                        </span>
                      </div>
                    </SidebarMenuSubButton>
                  ))}
                  <SidebarMenuSubButton
                    onClick={() => handleAddAccount(AccountType.BANK)}
                    className="italic text-muted-foreground"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add Another Bank Account</span>
                  </SidebarMenuSubButton>
                </>
              )}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>

        {/* Vehicles Section */}
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => toggleSection(AssetType.VEHICLE)}
            className="justify-between"
          >
            <div className="flex items-center gap-2">
              {assetTypeIcons[AssetType.VEHICLE]}
              <span>{assetTypeLabels[AssetType.VEHICLE]}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {groupedAssets[AssetType.VEHICLE].length}
            </span>
          </SidebarMenuButton>

          {openSections.includes(AssetType.VEHICLE) && (
            <SidebarMenuSub>
              {groupedAssets[AssetType.VEHICLE].length === 0 ? (
                <SidebarMenuSubButton
                  onClick={() => handleAddAsset(AssetType.VEHICLE)}
                  className="italic text-muted-foreground"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Vehicle</span>
                </SidebarMenuSubButton>
              ) : (
                <>
                  {groupedAssets[AssetType.VEHICLE].map((asset) => (
                    <SidebarMenuSubButton
                      key={asset.id}
                      onClick={() => router.push(`/assets/${asset.id}`)}
                      className="py-2 h-auto"
                    >
                      <div className="flex flex-col items-start gap-1 w-full">
                        <span className="leading-none">{asset.name}</span>
                        <span className="text-xs text-muted-foreground leading-none">
                          {formatTotalAmount(asset.currentValue || 0)}
                        </span>
                      </div>
                    </SidebarMenuSubButton>
                  ))}
                  <SidebarMenuSubButton
                    onClick={() => handleAddAsset(AssetType.VEHICLE)}
                    className="italic text-muted-foreground"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add Another Vehicle</span>
                  </SidebarMenuSubButton>
                </>
              )}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>

        {/* Real Estate Section */}
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => toggleSection(AssetType.REAL_ESTATE)}
            className="justify-between"
          >
            <div className="flex items-center gap-2">
              {assetTypeIcons[AssetType.REAL_ESTATE]}
              <span>{assetTypeLabels[AssetType.REAL_ESTATE]}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {groupedAssets[AssetType.REAL_ESTATE].length}
            </span>
          </SidebarMenuButton>

          {openSections.includes(AssetType.REAL_ESTATE) && (
            <SidebarMenuSub>
              {groupedAssets[AssetType.REAL_ESTATE].length === 0 ? (
                <SidebarMenuSubButton
                  onClick={() => handleAddAsset(AssetType.REAL_ESTATE)}
                  className="italic text-muted-foreground"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Real Estate</span>
                </SidebarMenuSubButton>
              ) : (
                <>
                  {groupedAssets[AssetType.REAL_ESTATE].map((asset) => (
                    <SidebarMenuSubButton
                      key={asset.id}
                      onClick={() => router.push(`/assets/${asset.id}`)}
                      className="py-2 h-auto"
                    >
                      <div className="flex flex-col items-start gap-1 w-full">
                        <span className="leading-none">{asset.name}</span>
                        <span className="text-xs text-muted-foreground leading-none">
                          {formatTotalAmount(asset.currentValue || 0)}
                        </span>
                      </div>
                    </SidebarMenuSubButton>
                  ))}
                  <SidebarMenuSubButton
                    onClick={() => handleAddAsset(AssetType.REAL_ESTATE)}
                    className="italic text-muted-foreground"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add Another Property</span>
                  </SidebarMenuSubButton>
                </>
              )}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>

        {/* Investments Section */}
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => toggleSection(AccountType.INVESTMENT)}
            className="justify-between"
          >
            <div className="flex items-center gap-2">
              {accountTypeIcons[AccountType.INVESTMENT]}
              <span>{accountTypeLabels[AccountType.INVESTMENT]}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {groupedAccounts[AccountType.INVESTMENT].length}
            </span>
          </SidebarMenuButton>

          {openSections.includes(AccountType.INVESTMENT) && (
            <SidebarMenuSub>
              <SidebarMenuSubButton
                onClick={() => handleAddAccount(AccountType.INVESTMENT)}
                className="italic text-muted-foreground"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Investment Account</span>
              </SidebarMenuSubButton>
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>

        {/* Stocks Section */}
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => toggleSection(AssetType.STOCK)}
            className="justify-between"
          >
            <div className="flex items-center gap-2">
              {assetTypeIcons[AssetType.STOCK]}
              <span>{assetTypeLabels[AssetType.STOCK]}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {groupedAssets[AssetType.STOCK].length}
            </span>
          </SidebarMenuButton>

          {openSections.includes(AssetType.STOCK) && (
            <SidebarMenuSub>
              <SidebarMenuSubButton
                onClick={() => handleAddAsset(AssetType.STOCK)}
                className="italic text-muted-foreground"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Stock</span>
              </SidebarMenuSubButton>
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>

        {/* Cryptocurrencies Section */}
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => toggleSection(AssetType.CRYPTO)}
            className="justify-between"
          >
            <div className="flex items-center gap-2">
              {assetTypeIcons[AssetType.CRYPTO]}
              <span>{assetTypeLabels[AssetType.CRYPTO]}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {groupedAssets[AssetType.CRYPTO].length}
            </span>
          </SidebarMenuButton>

          {openSections.includes(AssetType.CRYPTO) && (
            <SidebarMenuSub>
              <SidebarMenuSubButton
                onClick={() => handleAddAsset(AssetType.CRYPTO)}
                className="italic text-muted-foreground"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Cryptocurrency</span>
              </SidebarMenuSubButton>
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>

        {/* Other Accounts Section */}
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => toggleSection(AccountType.OTHER)}
            className="justify-between"
          >
            <div className="flex items-center gap-2">
              {accountTypeIcons[AccountType.OTHER]}
              <span>{accountTypeLabels[AccountType.OTHER]}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {groupedAccounts[AccountType.OTHER].length}
            </span>
          </SidebarMenuButton>

          {openSections.includes(AccountType.OTHER) && (
            <SidebarMenuSub>
              <SidebarMenuSubButton
                onClick={() => handleAddAccount(AccountType.OTHER)}
                className="italic text-muted-foreground"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Other Account</span>
              </SidebarMenuSubButton>
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={dialogState.isOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden p-8">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl">{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="px-1">
            {renderForm()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 