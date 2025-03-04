"use client";

import { Inter } from "next/font/google";
import { AccountsProvider } from "@/contexts/AccountsContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { AuthHeader } from "@/components/auth/AuthHeader";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

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
              <div className="flex flex-col min-h-screen w-full bg-background text-foreground">
                <AuthHeader />
                <div className="flex flex-1">
                  <Sidebar />
                  <div className="flex-1 p-4 md:p-6 overflow-hidden w-full">
                    {children}
                  </div>
                </div>
              </div>
            </SidebarProvider>
          </AccountsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
