import FooterSection from "@/components/homepage/footer";
import HeroSection from "@/components/homepage/hero-section";
import Integrations from "@/components/homepage/integrations";
import EnhancedPricing from "@/components/enhanced-pricing";

export default function Home() {
  // Default values for build time - will be dynamic in production
  const userTier = 'free' as const;
  const currentUsage = {
    aiTokens: 0,
    smsMessages: 0,
    monthlyCost: 0
  };

  return (
    <>
      <HeroSection />
      <Integrations />
      <EnhancedPricing 
        userTier={userTier}
        currentUsage={currentUsage}
      />
      <FooterSection />
    </>
  );
}
