import EnhancedPricing from "@/components/enhanced-pricing";

export default function PricingPage() {
  // Default values for build time - will be dynamic in production
  const userTier = 'free' as const;
  const currentUsage = {
    aiTokens: 0,
    smsMessages: 0,
    monthlyCost: 0
  };

  return (
    <div className="min-h-screen bg-background">
      <EnhancedPricing 
        userTier={userTier}
        currentUsage={currentUsage}
      />
    </div>
  );
}
