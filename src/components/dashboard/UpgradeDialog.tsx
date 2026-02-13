import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Zap } from "lucide-react";

interface UpgradeDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for trying out",
    features: [
      "50 files/month",
      "100 AI requests/month",
      "Basic templates",
      "Standard support",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For power users",
    features: [
      "Unlimited files",
      "500 AI requests/month",
      "All 15+ templates",
      "Priority support",
      "Advanced formulas",
      "Export to all formats",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Team",
    price: "$49",
    period: "/month",
    description: "For small teams",
    features: [
      "Everything in Pro",
      "Unlimited AI requests",
      "Team collaboration",
      "Shared templates",
      "Admin dashboard",
      "API access",
    ],
    cta: "Contact Sales",
  },
];

export function UpgradeDialog({ open, onOpenChange, trigger }: UpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Choose the plan that best fits your needs. Upgrade anytime to unlock more features.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {PLANS.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
            >
              {plan.popular && (
                <Badge 
                  className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={plan.disabled}
                >
                  {plan.disabled ? (
                    "Current Plan"
                  ) : plan.name === "Team" ? (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      {plan.cta}
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      {plan.cta}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>All plans include SSL security, automatic backups, and regular updates.</p>
          <p className="mt-1">
            Questions?{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
