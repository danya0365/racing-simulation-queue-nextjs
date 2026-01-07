import { MainLayout } from "@/src/presentation/components/layout/MainLayout";
import { ThemeProvider } from "@/src/presentation/providers/ThemeProvider";
import type { Metadata } from "next";
import "../public/styles/index.css";

export const metadata: Metadata = {
  title: "Racing Queue - ระบบจองคิว Racing Simulator",
  description: "ระบบจองคิวสำหรับร้านเกม Racing Simulation - จองคิวง่าย รวดเร็ว",
  keywords: ["racing simulator", "จองคิว", "racing game", "simulation"],
  authors: [{ name: "Racing Queue Team" }],
  openGraph: {
    title: "Racing Queue - ระบบจองคิว Racing Simulator",
    description: "ระบบจองคิวสำหรับร้านเกม Racing Simulation",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
