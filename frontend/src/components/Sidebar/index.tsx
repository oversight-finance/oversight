import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Home, User, BarChart, Sliders, Settings, Link } from "lucide-react";
import Optimizer from "@/components/Optimizer/Optimizer";
import Accounts from "@/components/Accounts/Accounts";

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
    },
    {
        title: "Investments",
        url: "#",
        icon: BarChart,
    },
    {
        title: "Settings",
        url: "#",
        icon: Settings,
    },
];

function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                            <SidebarMenuItem>
                                <div className="w-full">
                                    <Accounts />
                                </div>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <div className="w-full">
                                    <Optimizer />
                                </div>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}

export default AppSidebar;