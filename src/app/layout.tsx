import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = "https://assist-flow-chat.vercel.app";
const TITLE = "AssistFlow — AI Customer Support Automation Platform";
const DESCRIPTION =
  "AI-powered customer support that automates conversations, tickets, CRM, and human handoff.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s — AssistFlow",
  },
  description: DESCRIPTION,
  keywords: [
    "AI customer support",
    "Make.com automation",
    "customer support automation",
    "AI chatbot",
    "helpdesk automation",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "AssistFlow",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
