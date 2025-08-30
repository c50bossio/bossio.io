"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SubscriptionDetails = {
  id: string;
  productId: string;
  status: string;
  amount: number;
  currency: string;
  recurringInterval: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  organizationId: string | null;
};

type SubscriptionDetailsResult = {
  hasSubscription: boolean;
  subscription?: SubscriptionDetails;
  error?: string;
  errorType?: "CANCELED" | "EXPIRED" | "GENERAL";
};

interface PricingTableProps {
  subscriptionDetails: SubscriptionDetailsResult;
}

export default function PricingTable({
  subscriptionDetails,
}: PricingTableProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        setIsAuthenticated(!!session.data?.user);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleCheckout = async (productId: string, slug: string) => {
    if (isAuthenticated === false) {
      router.push("/sign-in");
      return;
    }

    try {
      await authClient.checkout({
        products: [productId],
        slug: slug,
      });
    } catch (error) {
      console.error("Checkout failed:", error);
      // TODO: Add user-facing error notification
      toast.error("Oops, something went wrong");
    }
  };

  const handleManageSubscription = async () => {
    try {
      await authClient.customer.portal();
    } catch (error) {
      console.error("Failed to open customer portal:", error);
      toast.error("Failed to open subscription management");
    }
  };

  const STARTER_TIER = process.env.NEXT_PUBLIC_STARTER_TIER;
  const STARTER_SLUG = process.env.NEXT_PUBLIC_STARTER_SLUG;

  if (!STARTER_TIER || !STARTER_SLUG) {
    throw new Error("Missing required environment variables for Starter tier");
  }

  const isCurrentPlan = (tierProductId: string) => {
    return (
      subscriptionDetails.hasSubscription &&
      subscriptionDetails.subscription?.productId === tierProductId &&
      subscriptionDetails.subscription?.status === "active"
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <section className="flex flex-col items-center justify-center px-4 mb-24 w-full">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-medium tracking-tight mb-4">
          Insights Free, Agents Paid
        </h1>
        <p className="text-xl text-muted-foreground">
          Get complete business intelligence for free. Pay only for AI coaching that grows your business.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full">
        {/* Free Tier */}
        <Card className="relative h-fit">
          <CardHeader>
            <CardTitle className="text-2xl">Insights Free</CardTitle>
            <CardDescription>Complete business intelligence at no cost</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/forever</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>Business Intelligence Dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>Service & Client Management</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>Analytics & Reporting</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>Calendar Integration</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>Basic Notifications</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant="outline"
            >
              Always Free
            </Button>
          </CardFooter>
        </Card>

        {/* AI Agents Paid */}
        <Card className="relative h-fit border-primary">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground">
              Most Popular
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">AI Agents</CardTitle>
            <CardDescription>Pay-as-you-grow AI business coaching</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0.04</span>
              <span className="text-muted-foreground">/1K tokens</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>Everything in Free</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>AI Business Coaching</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>Smart Recommendations</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>Predictive Analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>SMS Notifications ($0.01/msg)</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              {isAuthenticated === false
                ? "Sign In to Launch Agents"
                : "Launch AI Agents"}
            </Button>
          </CardFooter>
        </Card>

        {/* Enterprise */}
        <Card className="relative h-fit">
          <CardHeader>
            <CardTitle className="text-2xl">Enterprise</CardTitle>
            <CardDescription>Multi-location business management</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">Custom</span>
              <span className="text-muted-foreground">/pricing</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>Everything in AI Agents</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>Multi-Location Management</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>Advanced Integrations</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>Priority Support</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>Custom Features</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant="outline"
            >
              Contact Sales
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          Need a custom plan?{" "}
          <span className="text-primary cursor-pointer hover:underline">
            Contact us
          </span>
        </p>
      </div>
    </section>
  );
}
