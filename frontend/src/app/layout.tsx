"use client";

import { Inter } from "next/font/google";
import { AccountsProvider } from "@/contexts/AccountsContext";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { NavBar } from "@/components/Interface/NavBar";
import "@/app/globals.css";
import { Button } from "@/components/ui/button";
import { PanelLeftIcon, PanelRightIcon } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

// Sidebar toggle button component
function SidebarToggle() {
  const { toggleSidebar, state } = useSidebar();
  const isExpanded = state === "expanded";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="fixed left-4 bottom-4 z-50 h-10 w-10 rounded-full shadow-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
      aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
    >
      {isExpanded ? <PanelLeftIcon size={18} /> : <PanelRightIcon size={18} />}
    </Button>
  );
}

// Create a component that will conditionally render the sidebar
function MainContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground">
      <NavBar />
      <div className="flex flex-1">
        {user && <Sidebar />}
        <div className={`flex-1 p-4 md:p-6 overflow-hidden w-full`}>
          {user && <SidebarToggle />}
          {children}
        </div>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AccountsProvider>
            <SidebarProvider>
              <MainContent>{children}</MainContent>
            </SidebarProvider>
          </AccountsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
