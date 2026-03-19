"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Check,
  X,
  ArrowLeft,
  Sparkles,
  Crown,
  Building2,
  Zap,
  Shield,
  Clock,
  FileText,
  Infinity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingTier {
  name: string;
  description: string;
  price: number;
  period: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  popular?: boolean;
  features: {
    included: string[];
    excluded?: string[];
  };
  limits: {
    fileSize: string;
    filesPerDay: string;
    processing: string;
  };
  cta: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    description: "Perfect for occasional PDF tasks",
    price: 0,
    period: "forever",
    icon: Zap,
    gradient: "from-gray-500 to-slate-600",
    features: {
      included: [
        "All 60+ PDF tools",
        "Basic compression",
        "PDF merging & splitting",
        "File size estimator",
        "Mobile-friendly",
        "No signup required",
      ],
      excluded: [
        "Priority processing",
        "Batch processing",
        "API access",
        "Extended file history",
        "Custom branding",
      ],
    },
    limits: {
      fileSize: "50 MB",
      filesPerDay: "10 files",
      processing: "Standard",
    },
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    description: "For power users and professionals",
    price: 5,
    period: "month",
    icon: Sparkles,
    gradient: "from-violet-500 to-purple-600",
    popular: true,
    features: {
      included: [
        "Everything in Free",
        "500 MB file size limit",
        "Unlimited files per day",
        "Priority processing",
        "Batch processing",
        "Extended file history (30 days)",
        "Ad-free experience",
        "Email support",
      ],
    },
    limits: {
      fileSize: "500 MB",
      filesPerDay: "Unlimited",
      processing: "Priority",
    },
    cta: "Start Pro Trial",
  },
  {
    name: "Enterprise",
    description: "For teams and organizations",
    price: 0,
    period: "custom",
    icon: Building2,
    gradient: "from-amber-500 to-orange-600",
    features: {
      included: [
        "Everything in Pro",
        "Unlimited file size",
        "API access",
        "Custom integrations",
        "Team management",
        "Analytics dashboard",
        "Custom branding",
        "SLA guarantee",
        "Dedicated support",
      ],
    },
    limits: {
      fileSize: "Unlimited",
      filesPerDay: "Unlimited",
      processing: "Dedicated",
    },
    cta: "Contact Sales",
  },
];

const comparisonFeatures = [
  {
    name: "File Size Limit",
    free: "50 MB",
    pro: "500 MB",
    enterprise: "Unlimited",
  },
  {
    name: "Files per Day",
    free: "10",
    pro: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    name: "Processing Speed",
    free: "Standard",
    pro: "Priority",
    enterprise: "Dedicated",
  },
  {
    name: "File History",
    free: "24 hours",
    pro: "30 days",
    enterprise: "Unlimited",
  },
  {
    name: "Batch Processing",
    free: false,
    pro: true,
    enterprise: true,
  },
  {
    name: "API Access",
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    name: "Ad-Free Experience",
    free: false,
    pro: true,
    enterprise: true,
  },
  {
    name: "Custom Branding",
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    name: "Team Management",
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    name: "Priority Support",
    free: false,
    pro: true,
    enterprise: true,
  },
  {
    name: "Dedicated Support",
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    name: "SLA Guarantee",
    free: false,
    pro: false,
    enterprise: true,
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const yearlyDiscount = 0.2; // 20% off

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that fits your needs. Start free, upgrade when you need more power.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 rounded-full bg-muted">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                billingPeriod === "monthly"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                billingPeriod === "yearly"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yearly
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {pricingTiers.map((tier, index) => {
            const Icon = tier.icon;
            const price =
              tier.price === 0
                ? 0
                : billingPeriod === "yearly"
                ? Math.round(tier.price * 12 * (1 - yearlyDiscount))
                : tier.price;

            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className={cn(
                  "glass-card rounded-3xl p-6 relative overflow-hidden",
                  tier.popular && "ring-2 ring-primary"
                )}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-medium px-4 py-1 rounded-bl-xl">
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                      tier.gradient
                    )}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    {tier.price === 0 ? (
                      <span className="text-4xl font-bold">Free</span>
                    ) : tier.price === "custom" ? (
                      <span className="text-4xl font-bold">Custom</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">${price}</span>
                        <span className="text-muted-foreground">
                          /{billingPeriod === "yearly" ? "year" : "month"}
                        </span>
                      </>
                    )}
                  </div>
                  {tier.price > 0 && tier.price !== "custom" && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {billingPeriod === "yearly"
                        ? `Billed as $${price} per year`
                        : `Billed monthly`}
                    </p>
                  )}
                </div>

                <Button
                  className={cn(
                    "w-full mb-6 rounded-full",
                    tier.popular && "btn-gradient text-white"
                  )}
                  variant={tier.popular ? "default" : "outline"}
                  size="lg"
                >
                  {tier.cta}
                </Button>

                {/* Limits */}
                <div className="space-y-3 mb-6 pb-6 border-b">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">File size limit</span>
                    <span className="font-medium">{tier.limits.fileSize}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Files per day</span>
                    <span className="font-medium">{tier.limits.filesPerDay}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Processing</span>
                    <span className="font-medium">{tier.limits.processing}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {tier.features.included.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {tier.features.excluded?.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-3xl p-8 mb-16"
        >
          <h2 className="text-2xl font-bold text-center mb-8">
            Compare All Features
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-medium">Feature</th>
                  <th className="text-center py-4 px-4 font-medium">Free</th>
                  <th className="text-center py-4 px-4 font-medium bg-primary/5">Pro</th>
                  <th className="text-center py-4 px-4 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature) => (
                  <tr key={feature.name} className="border-b last:border-b-0">
                    <td className="py-4 px-4">{feature.name}</td>
                    <td className="py-4 px-4 text-center">
                      {typeof feature.free === "boolean" ? (
                        feature.free ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="text-sm">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center bg-primary/5">
                      {typeof feature.pro === "boolean" ? (
                        feature.pro ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="text-sm font-medium">{feature.pro}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {typeof feature.enterprise === "boolean" ? (
                        feature.enterprise ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="text-sm font-medium">{feature.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>

          <div className="space-y-6 text-left">
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-2">Can I switch plans anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                and we&apos;ll prorate any charges.
              </p>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, American Express) through our
                secure payment processor. Enterprise customers can also pay via invoice.
              </p>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-2">Is there a free trial for Pro?</h3>
              <p className="text-muted-foreground">
                Yes! New Pro users get a 7-day free trial with full access to all Pro features.
                No credit card required to start.
              </p>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-2">What happens to my files?</h3>
              <p className="text-muted-foreground">
                Your files are processed securely and deleted after processing. We never store your
                files longer than necessary. Free users&apos; files are deleted within 24 hours.
              </p>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-muted-foreground">
                Yes, we offer a 30-day money-back guarantee for all paid plans. If you&apos;re not
                satisfied, contact our support team for a full refund.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted mb-4">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm">All plans include 256-bit SSL encryption</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of users who trust PDFMagic for their PDF needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="btn-gradient text-white rounded-full px-8">
                Start Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-full px-8">
              Contact Sales
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
