"use client";

import { useAccounts } from "@/contexts/AccountsContext";
import { AccountType } from "@/types/Account";
import {
  PlusCircle,
  Building2,
  Coins,
  Home,
  Car,
  Wallet,
  CircleDollarSign,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateAccount from "@/components/LinkedAccounts/CreateAccount";

const typeIcons = {
  [AccountType.BANK]: <Building2 className="h-4 w-4" />,
  [AccountType.INVESTMENT]: <Coins className="h-4 w-4" />,
  [AccountType.OTHER]: <CircleDollarSign className="h-4 w-4" />,
};

const typeLabels = {
  [AccountType.BANK]: "Banks",
  [AccountType.INVESTMENT]: "Investments",
  [AccountType.OTHER]: "Other",
};

export function AccountsSidebar() {
  const { accounts } = useAccounts();
  const router = useRouter();
  const [openSections, setOpenSections] = useState<AccountType[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<AccountType>(AccountType.BANK);

  const toggleSection = (type: AccountType) => {
    setOpenSections((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleAddAsset = (type: AccountType) => {
    setSelectedAssetType(type);
    setDialogOpen(true);
  };

  const groupedAccounts = Object.values(AccountType).reduce((acc, type) => {
    acc[type] = accounts.filter((account) => account.accountType === type);
    return acc;
  }, {} as Record<AccountType, typeof accounts>);

  return (
    <>
      <SidebarMenu>
        {Object.values(AccountType).map((type) => (
          <SidebarMenuItem key={type}>
            <SidebarMenuButton
              onClick={() => toggleSection(type)}
              className="justify-between"
            >
              <div className="flex items-center gap-2">
                {typeIcons[type]}
                <span>{typeLabels[type]}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {groupedAccounts[type].length}
              </span>
            </SidebarMenuButton>

            {openSections.includes(type) && (
              <SidebarMenuSub>
                {groupedAccounts[type].length === 0 ? (
                  <SidebarMenuSubButton
                    onClick={() => handleAddAsset(type)}
                    className="italic text-muted-foreground"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add {typeLabels[type]}</span>
                  </SidebarMenuSubButton>
                ) : (
                  <>
                    {groupedAccounts[type].map((account) => (
                      <SidebarMenuSubButton
                        key={account.id}
                        onClick={() => router.push(`/accounts/${account.id}`)}
                        className="py-2 h-auto"
                      >
                        <div className="flex flex-col items-start gap-1 w-full">
                          <span className="leading-none">{account.bankName}</span>
                          <span className="text-xs text-muted-foreground leading-none">
                            {account.accountNumber}
                          </span>
                        </div>
                      </SidebarMenuSubButton>
                    ))}
                    <SidebarMenuSubButton
                      onClick={() => handleAddAsset(type)}
                      className="italic text-muted-foreground"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Add Another {typeLabels[type].slice(0, -1)}</span>
                    </SidebarMenuSubButton>
                  </>
                )}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New {typeLabels[selectedAssetType].slice(0, -1)}</DialogTitle>
          </DialogHeader>
          <CreateAccount defaultType={selectedAssetType} />
        </DialogContent>
      </Dialog>
    </>
  );
}
