import { motion } from "framer-motion";
import { Zap, Lock, Users, CheckCircle2 } from "lucide-react";

const TrustSignals = () => {
  const signals = [
    {
      icon: <Zap className="h-5 w-5" />,
      label: "100% Free",
      description: "No hidden fees or credit card required",
    },
    {
      icon: <Lock className="h-5 w-5" />,
      label: "Secure & Private",
      description: "Your files are encrypted and deleted after 1 hour",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Trusted by Millions",
      description: "5M+ users rely on Chat to Edit monthly",
    },
    {
      icon: <CheckCircle2 className="h-5 w-5" />,
      label: "No Installation",
      description: "Works in any browser - no downloads needed",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 py-12"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {signals.map((signal, idx) => (
        <motion.div
          key={idx}
          className="flex items-start gap-4 p-4 rounded-lg hover:bg-accent/50 transition-colors"
          variants={itemVariants}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex-shrink-0">
            {signal.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">{signal.label}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {signal.description}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TrustSignals;
