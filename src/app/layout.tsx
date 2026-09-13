import type { Metadata } from "next";
import { Nunito, Fira_Code } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "5-Agent-Cats Audit",
  description: "AI Smart Contract Auditing on Avalanche",
};

import { AuditProvider } from "@/context/AuditContext";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${firaCode.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuditProvider>
          {children}
        </AuditProvider>
      </body>
    </html>
  );
}
