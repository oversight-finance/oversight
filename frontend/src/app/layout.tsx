"use client"

import { Inter } from "next/font/google"
import { AccountsProvider } from "@/contexts/AccountsContext"
import { SidebarProvider } from "@/components/ui/sidebar"
import Sidebar from "@/components/Sidebar"
import "@/app/globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" >
      <body className={inter.className}>
        <AccountsProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background text-foreground">
              <Sidebar />
              <div className="flex-1 p-4 md:p-6 overflow-hidden w-full">
                {children}
              </div>
            </div>
          </SidebarProvider>
        </AccountsProvider>
      </body>
    </html>
  )
}
