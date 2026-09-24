import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ShowcaseSection } from "@/components/landing/ShowcaseSection";
import { FooterSection } from "@/components/landing/FooterSection";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0B] text-gray-100 flex flex-col font-sans selection:bg-indigo-500/30">
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ShowcaseSection />
      <FooterSection />
    </main>
  );
}
