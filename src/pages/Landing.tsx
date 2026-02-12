import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
