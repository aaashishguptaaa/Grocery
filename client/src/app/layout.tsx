
import type { Metadata } from "next";
import { Toaster } from 'react-hot-toast';

import "./globals.css";
import Provider from "@/Provider";
import StoreProvider from "@/redux/StoreProvider";
import InitUser from "@/InitUser";




export const metadata: Metadata = {
  title: "grocery | 10 Minutes Grocery Delivery",
  description: "grocery - Farm-fresh groceries, daily essentials, and pantry staples delivered in 10 minutes",
  icons: {
    icon: "/grocery-logo.svg"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="w-full min-h-screen bg-[#f8fafc]" suppressHydrationWarning>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '16px', padding: '12px 16px', fontSize: '13px', fontWeight: '600' } }} />
        <Provider>
          <StoreProvider>
          
        <InitUser/>
        
        {children}
          </StoreProvider>
        </Provider>
      </body>
    </html>
  );
}
