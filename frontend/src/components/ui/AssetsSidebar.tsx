"use client";

import { useAssets } from "@/contexts/AssetsContext";
import { useAccounts } from "@/contexts/AccountsContext";
import { Asset, AssetType } from "@/types/Asset";
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
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatTotalAmount } from "@/lib/utils";
import VehicleForm from "@/components/Assets/VehicleForm";
import RealEstateForm from "@/components/Assets/RealEstateForm";
import BankForm from "@/components/LinkedAccounts/BankForm";
import { Account, AccountType, BankAccount } from "@/types/Account";
import { fetchBankAccounts } from "@/database/Accounts";
import React from "react";

const assetTypeIcons = {
  [AssetType.CRYPTO]: <Coins className="h-4 w-4" />,
  [AssetType.STOCK]: <CircleDollarSign className="h-4 w-4" />,
  [AssetType.REAL_ESTATE]: <Home className="h-4 w-4" />,
  [AssetType.VEHICLE]: <Car className="h-4 w-4" />,
};

const accountTypeIcons: Record<AccountType, React.ReactNode> = {
  [AccountType.BANK]: <Building2 className="h-4 w-4" />,
  [AccountType.INVESTMENT]: <Coins className="h-4 w-4" />,
  [AccountType.CRYPTO]: <Coins className="h-4 w-4" />,
  [AccountType.CREDIT]: <CircleDollarSign className="h-4 w-4" />,
  [AccountType.SAVINGS]: <Building2 className="h-4 w-4" />,
  [AccountType.STOCK]: <CircleDollarSign className="h-4 w-4" />,
  [AccountType.REAL_ESTATE]: <Home className="h-4 w-4" />,
  [AccountType.VEHICLE]: <Car className="h-4 w-4" />,
};

const assetTypeLabels = {
  [AssetType.CRYPTO]: "Cryptocurrencies",
  [AssetType.STOCK]: "Stocks",
  [AssetType.REAL_ESTATE]: "Real Estate",
  [AssetType.VEHICLE]: "Vehicles",
};

// Create account type labels dynamically from enum
const accountTypeLabels = Object.values(AccountType).reduce((acc, type) => {
  // Convert type from snake_case to Title Case and add "Accounts"
  const label =
    type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ") + " Accounts";

  acc[type] = label;
  return acc;
}, {} as Record<AccountType, string>);

type DialogState = {
  isOpen: boolean;
  type: "account" | "asset";
  subtype: AccountType | AssetType;
};

// Interface to track bank account details
interface EnhancedAccount extends Account {
  bankDetails?: BankAccount;
}

export function AssetsSidebar() {
  const { assets } = useAssets();
  const { accounts } = useAccounts();
  const router = useRouter();
  const [openSections, setOpenSections] = useState<(AccountType | AssetType)[]>(
    []
  );
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    type: "account",
    subtype: AccountType.BANK,
  });
  const [enhancedAccounts, setEnhancedAccounts] = useState<EnhancedAccount[]>(
    []
  );

  // Fetch additional details for bank accounts
  useEffect(() => {
    const fetchBankDetails = async () => {
      if (accounts.length === 0) return;

      // Filter bank accounts
      const bankAccountIds = accounts
        .filter((account) => account.account_type === AccountType.BANK)
        .map((account) => account.id);

      if (bankAccountIds.length === 0) return;

      // Fetch bank account details
      const bankAccountsMap = await fetchBankAccounts(bankAccountIds);

      // Enhance accounts with bank details
      const enhanced = accounts.map((account) => {
        if (account.account_type === AccountType.BANK) {
          return {
            ...account,
            bankDetails: bankAccountsMap.get(account.id),
          };
        }
        return account;
      });

      setEnhancedAccounts(enhanced);
    };

    fetchBankDetails();
  }, [accounts]);

  const toggleSection = (type: AccountType | AssetType) => {
    setOpenSections((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleAddAsset = (type: AssetType) => {
    setDialogState({
      isOpen: true,
      type: "asset",
      subtype: type,
    });
  };

  const handleAddAccount = (type: AccountType) => {
    setDialogState({
      isOpen: true,
      type: "account",
      subtype: type,
    });
  };

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  const groupedAssets = Object.values(AssetType).reduce((acc, type) => {
    acc[type] = assets.filter((asset) => asset.type === type);
    return acc;
  }, {} as Record<AssetType, Asset[]>);

  const groupedAccounts = Object.values(AccountType).reduce((acc, type) => {
    acc[type] = enhancedAccounts.filter(
      (account) => account.account_type === type
    );
    return acc;
  }, {} as Record<AccountType, EnhancedAccount[]>);

  // Function to render the appropriate form based on asset/account type
  const renderForm = () => {
    if (dialogState.type === "asset") {
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
    if (dialogState.type === "asset") {
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
                <React.Fragment>
                  {groupedAccounts[AccountType.BANK].map((account) => (
                    <SidebarMenuSubButton
                      key={account.id}
                      onClick={() => router.push(`/accounts/${account.id}`)}
                      className="py-2 h-auto"
                    >
                      <div className="flex flex-col items-start gap-1 w-full">
                        <span className="leading-none">
                          {account.bankDetails?.account_name ||
                            `Account ${account.id}`}
                        </span>
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
                </React.Fragment>
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
                <React.Fragment>
                  {groupedAssets[AssetType.VEHICLE].map((asset) => (
                    <SidebarMenuSubButton
                      key={asset.id}
                      onClick={() => router.push(`/assets/${asset.id}`)}
                      className="py-2 h-auto"
                    >
                      <div className="flex flex-col items-start gap-1 w-full">
                        <span className="leading-none">{asset.name}</span>
                        <span className="text-xs text-muted-foreground leading-none">
                          {formatTotalAmount(asset.current_value || 0)}
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
                </React.Fragment>
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
                <React.Fragment>
                  {groupedAssets[AssetType.REAL_ESTATE].map((asset) => (
                    <SidebarMenuSubButton
                      key={asset.id}
                      onClick={() => router.push(`/assets/${asset.id}`)}
                      className="py-2 h-auto"
                    >
                      <div className="flex flex-col items-start gap-1 w-full">
                        <span className="leading-none">{asset.name}</span>
                        <span className="text-xs text-muted-foreground leading-none">
                          {formatTotalAmount(asset.current_value || 0)}
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
                </React.Fragment>
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

        {/* Credit Accounts Section */}
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => toggleSection(AccountType.CREDIT)}
            className="justify-between"
          >
            <div className="flex items-center gap-2">
              {accountTypeIcons[AccountType.CREDIT]}
              <span>{accountTypeLabels[AccountType.CREDIT]}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {groupedAccounts[AccountType.CREDIT]?.length || 0}
            </span>
          </SidebarMenuButton>

          {openSections.includes(AccountType.CREDIT) && (
            <SidebarMenuSub>
              <SidebarMenuSubButton
                onClick={() => handleAddAccount(AccountType.CREDIT)}
                className="italic text-muted-foreground"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Credit Account</span>
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
          <div className="px-1">{renderForm()}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
