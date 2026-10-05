import { Outfit } from "next/font/google";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";

/* Editorial display face for the marketing site (headings only — body copy
   stays on the app-wide Plus Jakarta Sans). Scoped to the (marketing) group
   so dashboards are unaffected. */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${outfit.variable} flex min-h-screen flex-col bg-white`}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
