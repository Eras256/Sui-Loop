import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { TranslatedTerms } from "./translated-terms";

export const metadata: Metadata = {
    title: "Terms of Service | SuiLoop Protocol",
    description: "Terms of Service and Legal Disclaimer for SuiLoop — open-source DeFi software infrastructure. Not a financial institution, not a custodian.",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#030014] text-white">
            <Navbar />
            <TranslatedTerms />
        </div>
    );
}

