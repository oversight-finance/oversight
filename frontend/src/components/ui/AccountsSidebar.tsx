import { useAccounts } from "@/contexts/AccountsContext";
import { AccountType } from "@/types/Account";
import { PlusCircle, Building2, Coins, Home, Car, Wallet, CircleDollarSign } from "lucide-react";
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubButton,
} from "./sidebar";
import { useState } from "react";

const typeIcons = {
    [AccountType.BANK]: <Building2 className="h-4 w-4" />,
    [AccountType.INVESTMENT]: <Coins className="h-4 w-4" />,
    [AccountType.REAL_ESTATE]: <Home className="h-4 w-4" />,
    [AccountType.VEHICLE]: <Car className="h-4 w-4" />,
    [AccountType.LOAN]: <Wallet className="h-4 w-4" />,
    [AccountType.OTHER]: <CircleDollarSign className="h-4 w-4" />,
};

const typeLabels = {
    [AccountType.BANK]: "Banks",
    [AccountType.INVESTMENT]: "Investments",
    [AccountType.REAL_ESTATE]: "Real Estate",
    [AccountType.VEHICLE]: "Vehicles",
    [AccountType.LOAN]: "Loans",
    [AccountType.OTHER]: "Other",
};

export function AccountsSidebar() {
    const { accounts } = useAccounts();
    const [openSections, setOpenSections] = useState<AccountType[]>([]);

    const toggleSection = (type: AccountType) => {
        setOpenSections(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const groupedAccounts = Object.values(AccountType).reduce((acc, type) => {
        acc[type] = accounts.filter(account => account.type === type);
        return acc;
    }, {} as Record<AccountType, typeof accounts>);

    return (
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
                                    href={`/accounts/new?type=${type.toLowerCase()}`}
                                    className="italic text-muted-foreground"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    <span>Add {typeLabels[type]}</span>
                                </SidebarMenuSubButton>
                            ) : (
                                groupedAccounts[type].map((account) => (
                                    <SidebarMenuSubButton
                                        key={account.id}
                                        href={`/accounts/${account.id}`}
                                        className="py-2 h-auto"
                                    >
                                        <div className="flex flex-col items-start gap-1 w-full">
                                            <span className="leading-none">{account.name}</span>
                                            {account.description && (
                                                <span className="text-xs text-muted-foreground leading-none">
                                                    {account.description}
                                                </span>
                                            )}
                                        </div>
                                    </SidebarMenuSubButton>
                                ))
                            )}
                        </SidebarMenuSub>
                    )}
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
} 