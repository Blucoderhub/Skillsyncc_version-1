import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, Crown, Zap, BookOpen, Award, MessageSquare, 
  Code2, Calendar, Users, Sparkles, Star
} from "lucide-react";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  { icon: BookOpen, text: "Access to beginner courses" },
  { icon: Code2, text: "Basic code editor" },
  { icon: MessageSquare, text: "Community forum access" },
  { icon: Calendar, text: "Hackathon listings" },
  { icon: Users, text: "Public leaderboard" },
];

const CLUB_FEATURES = [
  { icon: BookOpen, text: "Complete access to ALL courses", highlight: true },
  { icon: Award, text: "Course Certificates", highlight: true },
  { icon: MessageSquare, text: "Code Mentors on Discord", highlight: true },
  { icon: Sparkles, text: "Unlimited AI help from Lumi", highlight: true },
  { icon: Code2, text: "Unlimited project builds", highlight: true },
  { icon: Calendar, text: "Club-exclusive events & challenges", highlight: true },
  { icon: Star, text: "Monthly challenges with prizes" },
  { icon: Users, text: "Portfolio hosting" },
];

export default function Pricing() {
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const { data: subscription } = useQuery<{
    membershipStatus?: string;
  }>({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  const { data: productsData } = useQuery<{
    data?: Array<{
      id: string;
      name?: string;
      prices?: Array<{
        id: string;
        unit_amount: number;
        currency: string;
        recurring?: { interval: string };
      }>;
    }>;
  }>({
    queryKey: ["/api/products"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const res = await apiRequest("POST", "/api/checkout", { priceId });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/customer-portal", {});
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const isClubMember = subscription?.membershipStatus === "active";
  
  // Find Club product and prices
  const clubProduct = productsData?.data?.find((p: any) => 
    p.name?.toLowerCase().includes("club")
  );
  
  const monthlyPrice = clubProduct?.prices?.find((p: any) => 
    p.recurring?.interval === "month"
  );
  const yearlyPrice = clubProduct?.prices?.find((p: any) => 
    p.recurring?.interval === "year"
  );

  const selectedPrice = billingPeriod === "monthly" ? monthlyPrice : yearlyPrice;
  const monthlyAmount = monthlyPrice?.unit_amount ? (monthlyPrice.unit_amount / 100).toFixed(2) : "9.99";
  const yearlyAmount = yearlyPrice?.unit_amount ? (yearlyPrice.unit_amount / 100).toFixed(2) : "79.99";
  const yearlyMonthlyEquiv = yearlyPrice?.unit_amount ? ((yearlyPrice.unit_amount / 12) / 100).toFixed(2) : "6.67";

  const handleSubscribe = () => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    if (selectedPrice?.id) {
      checkoutMutation.mutate(selectedPrice.id);
    }
  };

  return (
    <div className="retro-container py-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-secondary font-display text-xs mb-4">
          <Crown className="w-4 h-4" />
          JOIN THE CLUB
        </div>
        <h1 className="text-4xl md:text-5xl font-display text-primary mb-4">
          Level Up Your Learning
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Make your career change to tech with unlimited access to learning content, 
          Club-only perks, and personalized support designed to help you reach your goals.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              billingPeriod === "monthly" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
            data-testid="button-monthly"
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
              billingPeriod === "yearly" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
            data-testid="button-yearly"
          >
            Yearly
            <Badge variant="secondary" className="text-xs">Save 33%</Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Zap className="w-5 h-5 text-muted-foreground" />
              Free
            </CardTitle>
            <CardDescription>
              Get started with the basics
            </CardDescription>
            <div className="pt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/forever</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {FREE_FEATURES.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {user ? (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Button variant="outline" className="w-full" asChild>
                <a href="/api/login">Get Started</a>
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Club Plan */}
        <Card className="relative border-2 border-primary bg-gradient-to-b from-primary/5 to-transparent">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground px-4 py-1">
              <Crown className="w-3 h-3 mr-1" />
              MOST POPULAR
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Crown className="w-5 h-5 text-primary" />
              Club
            </CardTitle>
            <CardDescription>
              Everything you need to succeed
            </CardDescription>
            <div className="pt-4">
              {billingPeriod === "monthly" ? (
                <>
                  <span className="text-4xl font-bold">${monthlyAmount}</span>
                  <span className="text-muted-foreground">/month</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold">${yearlyAmount}</span>
                  <span className="text-muted-foreground">/year</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    (${yearlyMonthlyEquiv}/month)
                  </p>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {CLUB_FEATURES.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className={cn(
                    "w-4 h-4 flex-shrink-0",
                    feature.highlight ? "text-primary" : "text-green-500"
                  )} />
                  <span className={cn(
                    "text-sm",
                    feature.highlight && "font-medium"
                  )}>{feature.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {isClubMember ? (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                data-testid="button-manage-subscription"
              >
                {portalMutation.isPending ? "Loading..." : "Manage Subscription"}
              </Button>
            ) : (
              <Button 
                className="w-full"
                onClick={handleSubscribe}
                disabled={checkoutMutation.isPending}
                data-testid="button-join-club"
              >
                {checkoutMutation.isPending ? "Loading..." : "Join Club Now"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-display text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Can I cancel anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Yes! You can cancel your subscription at any time. You'll continue to have 
                access until the end of your billing period.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What payment methods do you accept?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards, debit cards, and digital wallets through 
                our secure payment processor, Stripe.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What happens after I subscribe?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You'll get immediate access to all Club features including premium courses, 
                certificates, and exclusive events. Start learning right away!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
