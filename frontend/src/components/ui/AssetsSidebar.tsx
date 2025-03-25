"use client";

import { useAssets } from "@/contexts/AssetsContext";
import { useAccounts, AccountWithTransactions } from "@/contexts/AccountsContext";
import { Vehicle } from "@/types/Vehicle";
import { RealEstate } from "@/types/RealEstate";
import { PlusCircle, Coins, Home, Car, CircleDollarSign, Building2 } from "lucide-react";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubButton } from "./sidebar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatTotalAmount } from "@/lib/utils";
import VehicleForm from "@/components/Assets/VehicleForm";
import RealEstateForm from "@/components/Assets/RealEstateForm";
import BankForm from "@/components/LinkedAccounts/BankForm";
import CryptoWalletForm from "@/components/LinkedAccounts/CryptoWalletForm";
import { AccountType } from "@/types/Account";
import React from "react";
import { AssetType } from "@/types/Asset";
import InvestmentForm from "../Assets/InvestmentForm";

const assetTypeIcons: Record<AssetType, React.ReactNode> = {
  [AssetType.VEHICLE]: <Car className="h-4 w-4" />,
  [AssetType.REAL_ESTATE]: <Home className="h-4 w-4" />,
};

const accountTypeIcons: Record<AccountType, React.ReactNode> = {
  [AccountType.BANK]: <Building2 className="h-4 w-4" />,
  [AccountType.INVESTMENT]: <Coins className="h-4 w-4" />,
  [AccountType.CRYPTO]: <Coins className="h-4 w-4" />,
  [AccountType.CREDIT]: <CircleDollarSign className="h-4 w-4" />,
  [AccountType.SAVINGS]: <Building2 className="h-4 w-4" />,
};

const assetTypeLabels: Record<AssetType, string> = {
  [AssetType.VEHICLE]: "Vehicles",
  [AssetType.REAL_ESTATE]: "Real Estate",
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

// Helper function to extract street address from full address
const extractStreetAddress = (fullAddress: string): string => {
  if (!fullAddress) return "No Address";

  // Split by commas and take the first part (street address)
  const parts = fullAddress.split(",");
  return parts[0].trim();
};

// Helper function to format property type for display
const formatPropertyType = (propertyType: string): string => {
  if (!propertyType) return "Property";

  // Convert snake_case to Title Case
  return propertyType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export function AssetsSidebar() {
  const { assets } = useAssets();
  const { accounts } = useAccounts();
  const router = useRouter();
  const [openSections, setOpenSections] = useState<(AccountType | AssetType)[]>([]);
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    type: "account",
    subtype: AccountType.BANK,
  });

  // Split assets into vehicles and real estate
  const vehicles = assets.filter((asset): asset is Vehicle => "make" in asset);
  const realEstate = assets.filter((asset): asset is RealEstate => "address" in asset);

  const toggleSection = (type: AccountType | AssetType) => {
    setOpenSections((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
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

  // Get accounts of each type for display
  const getBankAccounts = () => {
    return Object.values(accounts[AccountType.BANK] || {});
  };

  const getInvestmentAccounts = () => {
    return Object.values(accounts[AccountType.INVESTMENT] || {});
  };

  const getCryptoAccounts = () => {
    return Object.values(accounts[AccountType.CRYPTO] || {});
  };

  const getCreditAccounts = () => {
    return Object.values(accounts[AccountType.CREDIT] || {});
  };

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
        case AccountType.INVESTMENT:
          return <InvestmentForm />;
        // Add other account type forms here as they are implemented
        case AccountType.CRYPTO:
          return <CryptoWalletForm />;
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

  // Get bank accounts for display
  const bankAccounts = getBankAccounts();
  const investmentAccounts = getInvestmentAccounts();
  const cryptoAccounts = getCryptoAccounts();
  const creditAccounts = getCreditAccounts();

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton className="font-semibold">Assets</SidebarMenuButton>
        </SidebarMenuItem>

        {/* Bank Accounts Section */}
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => toggleSection(AccountType.BANK)} className="justify-between">
            <div className="flex items-center gap-2">
              {accountTypeIcons[AccountType.BANK]}
              <span>{accountTypeLabels[AccountType.BANK]}</span>
            </div>
            <span className="text-xs text-muted-foreground">{bankAccounts.length}</span>
          </SidebarMenuButton>

          {openSections.includes(AccountType.BANK) && (
            <SidebarMenuSub>
              {bankAccounts.length === 0 ? (
                <SidebarMenuSubButton onClick={() => handleAddAccount(AccountType.BANK)} className="italic text-muted-foreground">
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Bank Account</span>
                </SidebarMenuSubButton>
              ) : (
                <React.Fragment>
                  {bankAccounts.map((account) => (
                    <SidebarMenuSubButton key={account.id} onClick={() => router.push(`/accounts/bank/${account.id}`)} className="py-2 h-auto">
                      <div className="flex flex-col items-start gap-1 w-full">
                        <span className="leading-none">{account.account_name || `Account ${account.id}`}</span>
                        <span className="text-xs text-muted-foreground leading-none">{formatTotalAmount(account.balance)}</span>
                      </div>
                    </SidebarMenuSubButton>
                  ))}
                  <SidebarMenuSubButton onClick={() => handleAddAccount(AccountType.BANK)} className="italic text-muted-foreground">
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
          <SidebarMenuButton onClick={() => toggleSection(AssetType.VEHICLE)} className="justify-between">
            <div className="flex items-center gap-2">
              {assetTypeIcons[AssetType.VEHICLE]}
              <span>{assetTypeLabels[AssetType.VEHICLE]}</span>
            </div>
            <span className="text-xs text-muted-foreground">{vehicles.length}</span>
          </SidebarMenuButton>

          {openSections.includes(AssetType.VEHICLE) && (
            <SidebarMenuSub>
              {vehicles.length === 0 ? (
                <SidebarMenuSubButton onClick={() => handleAddAsset(AssetType.VEHICLE)} className="italic text-muted-foreground">
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Vehicle</span>
                </SidebarMenuSubButton>
              ) : (
                <React.Fragment>
                  {vehicles.map((vehicle) => (
                    <SidebarMenuSubButton key={vehicle.id} onClick={() => router.push(`/assets/${vehicle.id}`)} className="py-2 h-auto">
                      <div className="flex flex-col items-start gap-1 w-full">
                        <span className="leading-none">
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </span>
                        <span className="text-xs text-muted-foreground leading-none">{formatTotalAmount(vehicle.current_value || 0)}</span>
                      </div>
                    </SidebarMenuSubButton>
                  ))}
                  <SidebarMenuSubButton onClick={() => handleAddAsset(AssetType.VEHICLE)} className="italic text-muted-foreground">
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
          <SidebarMenuButton onClick={() => toggleSection(AssetType.REAL_ESTATE)} className="justify-between">
            <div className="flex items-center gap-2">
              {assetTypeIcons[AssetType.REAL_ESTATE]}
              <span>{assetTypeLabels[AssetType.REAL_ESTATE]}</span>
            </div>
            <span className="text-xs text-muted-foreground">{realEstate.length}</span>
          </SidebarMenuButton>

          {openSections.includes(AssetType.REAL_ESTATE) && (
            <SidebarMenuSub>
              {realEstate.length === 0 ? (
                <SidebarMenuSubButton onClick={() => handleAddAsset(AssetType.REAL_ESTATE)} className="italic text-muted-foreground">
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Real Estate</span>
                </SidebarMenuSubButton>
              ) : (
                <React.Fragment>
                  {realEstate.map((property) => (
                    <SidebarMenuSubButton key={property.id} onClick={() => router.push(`/assets/${property.id}`)} className="py-2 h-auto">
                      <div className="flex flex-col items-start gap-1 w-full">
                        <span className="leading-none">
                          {formatPropertyType(property.property_type)}: {extractStreetAddress(property.address)}
                        </span>
                        <span className="text-xs text-muted-foreground leading-none">{formatTotalAmount(property.current_value || 0)}</span>
                      </div>
                    </SidebarMenuSubButton>
                  ))}
                  <SidebarMenuSubButton onClick={() => handleAddAsset(AssetType.REAL_ESTATE)} className="italic text-muted-foreground">
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
          <SidebarMenuButton onClick={() => toggleSection(AccountType.INVESTMENT)} className="justify-between">
            <div className="flex items-center gap-2">
              {accountTypeIcons[AccountType.INVESTMENT]}
              <span>{accountTypeLabels[AccountType.INVESTMENT]}</span>
            </div>
            <span className="text-xs text-muted-foreground">{investmentAccounts.length}</span>
          </SidebarMenuButton>

          {openSections.includes(AccountType.INVESTMENT) && (
            <SidebarMenuSub>
              {investmentAccounts.length === 0 ? (
                <SidebarMenuSubButton onClick={() => handleAddAccount(AccountType.INVESTMENT)} className="italic text-muted-foreground">
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Investment Account</span>
                </SidebarMenuSubButton>
              ) : (
                <React.Fragment>
                  {investmentAccounts.map((account) => (
                    <SidebarMenuSubButton key={account.id} onClick={() => router.push(`/accounts/investment/${account.id}`)} className="py-2 h-auto">
                      <div className="flex flex-col items-start gap-1 w-full">
                        <span className="leading-none">{account.account_name || `Account ${account.id}`}</span>
                        <span className="text-xs text-muted-foreground leading-none">{formatTotalAmount(account.balance)}</span>
                      </div>
                    </SidebarMenuSubButton>
                  ))}
                  <SidebarMenuSubButton onClick={() => handleAddAccount(AccountType.INVESTMENT)} className="italic text-muted-foreground">
                    <PlusCircle className="h-4 w-4" />
                    <span>Add Another Investment Account</span>
                  </SidebarMenuSubButton>
                </React.Fragment>
              )}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>
        {/* Cryptocurrencies Section */}
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => toggleSection(AccountType.CRYPTO)} className="justify-between">
            <div className="flex items-center gap-2">
              {accountTypeIcons[AccountType.CRYPTO]}
              <span>{accountTypeLabels[AccountType.CRYPTO]}</span>
            </div>
            <span className="text-xs text-muted-foreground">{cryptoAccounts.length}</span>
          </SidebarMenuButton>

          {openSections.includes(AccountType.CRYPTO) && (
            <SidebarMenuSub>
              {cryptoAccounts.length === 0 ? (
                <SidebarMenuSubButton onClick={() => handleAddAccount(AccountType.CRYPTO)} className="italic text-muted-foreground">
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Crypto Account</span>
                </SidebarMenuSubButton>
              ) : (
                <React.Fragment>
                  {cryptoAccounts.length > 0 &&
                    cryptoAccounts.map((account) => (
                      <SidebarMenuSubButton key={account.id} onClick={() => router.push(`/accounts/crypto/${account.id}`)} className="py-2 h-auto">
                        <div className="flex flex-col items-start gap-1 w-full">
                          <span className="leading-none">{account.account_name || `Account ${account.id}`}</span>
                          <span className="text-xs text-muted-foreground leading-none">{formatTotalAmount(account.balance)}</span>
                        </div>
                      </SidebarMenuSubButton>
                    ))}
                  <SidebarMenuSubButton onClick={() => handleAddAccount(AccountType.CRYPTO)} className="italic text-muted-foreground">
                    <PlusCircle className="h-4 w-4" />
                    <span>Add Another Crypto Account</span>
                  </SidebarMenuSubButton>
                </React.Fragment>
              )}
              <SidebarMenuSubButton onClick={() => handleAddAccount(AccountType.CRYPTO)} className="italic text-muted-foreground">
                <PlusCircle className="h-4 w-4" />
                <span>Add Cryptocurrency</span>
              </SidebarMenuSubButton>
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>

        {/* Credit Accounts Section */}
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => toggleSection(AccountType.CREDIT)} className="justify-between">
            <div className="flex items-center gap-2">
              {accountTypeIcons[AccountType.CREDIT]}
              <span>{accountTypeLabels[AccountType.CREDIT]}</span>
            </div>
            <span className="text-xs text-muted-foreground">{creditAccounts.length}</span>
          </SidebarMenuButton>

          {openSections.includes(AccountType.CREDIT) && (
            <SidebarMenuSub>
              <SidebarMenuSubButton onClick={() => handleAddAccount(AccountType.CREDIT)} className="italic text-muted-foreground">
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
