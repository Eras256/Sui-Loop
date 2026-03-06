import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "@mysten/dapp-kit/dist/index.css";
import { Providers } from "./providers";
import Footer from "@/components/layout/Footer";
import LegalBanner from "@/components/legal/LegalBanner";
import SuiLoopTermsModal from "@/components/legal/SuiLoopTermsModal";
import ToasterWrapper from "@/components/layout/ToasterWrapper";

import { PremiumAtmosphere } from "@/components/layout/PremiumAtmosphere";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "SuiLoop | Neural Economy & Matrix Intelligence",
    description: "The decentralized Neural Matrix for Sui. Orchestrate professional AI agents with on-chain reputation (ELO) and deep liquidity access.",
    openGraph: {
        images: [{ url: "/logo-seo.jpg" }],
    },
    twitter: {
        card: "summary_large_image",
        images: ["/logo-seo.jpg"],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-[#030014] text-white min-h-screen selection:bg-neon-cyan/30`}>
                <Providers>
                    <PremiumAtmosphere />
                    {children}
                    <Footer />
                    <LegalBanner />
                    <SuiLoopTermsModal />
                    <Toaster position="bottom-right" theme="dark" />
                    <ToasterWrapper />
                </Providers>
            </body>
        </html>
    );
}
