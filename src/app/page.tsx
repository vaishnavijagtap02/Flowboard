import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ShowcaseSection } from "@/components/landing/ShowcaseSection";
import { FooterSection } from "@/components/landing/FooterSection";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-ai/25 transition-colors">
      <LandingNavbar />
      <div className="pt-16">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ShowcaseSection />
        <FooterSection />
      </div>
    </main>
  );
}
