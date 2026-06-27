import type { Metadata } from "next";
import { Noto_Sans_Thai, Cinzel_Decorative, Itim } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-sans-thai",
});

const cinzel = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-cinzel",
});

const itim = Itim({
  subsets: ["thai", "latin"],
  weight: ["400"],
  variable: "--font-itim",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MangaZen — อ่านมังงะออนไลน์",
  description: "อ่านมังงะออนไลน์ฟรี รองรับ JPG, PNG, WebP, PDF พร้อมแปลภาษาด้วย AI",
};

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import ToasterWrapper from "@/components/ToasterWrapper";
import { LanguageProvider } from "@/components/LanguageProvider";
import AuthProvider from "@/components/AuthProvider";
import { SidebarProvider } from "@/components/SidebarContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${notoSansThai.variable} ${cinzel.variable} ${itim.variable}`}>
        <ThemeProvider attribute="data-theme" defaultTheme="dark">
          <AuthProvider>
            <LanguageProvider>
              <SidebarProvider>
                <Navbar />

                {/* LAYOUT */}
                <div className="layout">
                  <Sidebar />

                  <main>
                    {children}
                  </main>
                </div>
                <ToasterWrapper />
              </SidebarProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
