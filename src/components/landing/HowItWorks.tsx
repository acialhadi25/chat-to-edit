import { motion } from "framer-motion";
import { Upload, MessageSquare, Download } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: <Upload className="h-8 w-8" />,
      number: "1",
      title: "Upload",
      description: "Drag & drop atau pilih file Excel, PDF, atau DOCX",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      number: "2",
      title: "Chat dengan AI",
      description: "Jelaskan apa yang ingin kamu ubah dalam bahasa natural",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: <Download className="h-8 w-8" />,
      number: "3",
      title: "Download",
      description: "Dapatkan file hasil editing dalam hitungan detik",
      color: "from-emerald-500 to-emerald-600",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section className="relative py-24">
      <div className="container">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="mb-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            Gimana Cara Kerjanya?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tiga langkah mudah untuk mengedit dokumen dengan AI
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {steps.map((step, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-24 left-1/2 w-[calc(100%-2rem)] h-1 bg-gradient-to-r from-primary/50 to-transparent -translate-x-1/2" />
              )}

              <div className="relative flex flex-col items-center text-center">
                {/* Icon circle */}
                <motion.div
                  className={`relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {step.icon}
                  <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-background border-2 border-border font-bold text-sm text-primary">
                    {step.number}
                  </div>
                </motion.div>

                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
