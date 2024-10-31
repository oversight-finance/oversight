import type { Metadata } from "next";
import { fonts } from '@/lib/fonts'
import "./globals.css";

export const metadata: Metadata = {
  title: "Oversight",
  description: "Financial OS™",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fonts.sans.className}>
        {children}
      </body>
    </html>
  )
}
