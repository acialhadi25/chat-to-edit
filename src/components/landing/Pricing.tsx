import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const Pricing = () => {
  return (
    <section id="pricing" className="bg-secondary/30 py-20">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pilih Paket yang Sesuai
          </h2>
          <p className="text-lg text-muted-foreground">
            Mulai gratis, upgrade kapan saja kalau butuh lebih
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Free</h3>
              <p className="text-sm text-muted-foreground">Untuk coba-coba</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">Rp 0</span>
              <span className="text-muted-foreground">/bulan</span>
            </div>
            <ul className="mb-8 space-y-3">
              <PricingFeature>5 file per bulan</PricingFeature>
              <PricingFeature>Chat to Excel (full access)</PricingFeature>
              <PricingFeature>Maksimal 1.000 baris per file</PricingFeature>
              <PricingFeature>Conversation history 7 hari</PricingFeature>
              <PricingFeature>Support Bahasa Indonesia & English</PricingFeature>
            </ul>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/register">Mulai Gratis</Link>
            </Button>
          </div>

          <div className="relative rounded-xl border-2 border-primary bg-card p-8 shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
              POPULER
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Pro</h3>
              <p className="text-sm text-muted-foreground">Untuk profesional</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">Rp 99.000</span>
              <span className="text-muted-foreground">/bulan</span>
            </div>
            <ul className="mb-8 space-y-3">
              <PricingFeature>Unlimited file</PricingFeature>
              <PricingFeature>Chat to Excel (full access)</PricingFeature>
              <PricingFeature>Unlimited baris per file</PricingFeature>
              <PricingFeature>Conversation history selamanya</PricingFeature>
              <PricingFeature>Priority support</PricingFeature>
              <PricingFeature>Export multiple formats</PricingFeature>
            </ul>
            <Button className="w-full" asChild>
              <Link to="/register">Upgrade ke Pro</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

const PricingFeature = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
      <Check className="h-3 w-3" />
    </div>
    <span className="text-sm text-muted-foreground">{children}</span>
  </li>
);

export default Pricing;
