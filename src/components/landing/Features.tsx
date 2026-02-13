import { motion } from "framer-motion";
import {
  Languages,
  History,
  ShieldCheck,
  Zap,
  FileSpreadsheet,
  MessageSquareText,
  Files,
  Scissors,
  ClipboardEdit,
  BarChart3,
  Merge,
} from "lucide-react";

const Features = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section id="features" className="bg-gradient-to-b from-background via-background to-background py-16 sm:py-32 relative overflow-hidden">
      {/* Background decoration with product colors */}
      <div className="absolute inset-0 -z-10">
        {/* Red accent - left side */}
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-red-500/8 blur-3xl" />

        {/* Green accent - bottom */}
        <div className="absolute left-1/3 -bottom-40 h-[500px] w-[500px] rounded-full bg-green-500/8 blur-3xl" />

        {/* Blue accent - right side */}
        <div className="absolute right-0 top-1/2 h-96 w-96 rounded-full bg-blue-500/8 blur-3xl" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px] opacity-30" />
      </div>

      <div className="container px-4">
        <motion.div
          className="mx-auto mb-12 sm:mb-20 max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="mb-4 sm:mb-6 text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Satu Platform,<br />
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              Semua Tools
            </span>
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground">
            Kelola data Excel Anda melalui chat AI — cepat, mudah, dan fokus pada produktivitas data
          </p>
        </motion.div>

        {/* Tool highlight cards */}
        <motion.div
          className="mx-auto mb-12 sm:mb-20 grid max-w-6xl gap-4 sm:gap-6 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <ToolHighlight
            icon={<FileSpreadsheet className="h-7 w-7" />}
            title="Chat to Excel"
            features={["Formula generator via chat", "Data cleansing & transform", "Sort, filter, find/replace", "Conditional formatting", "AI Visualizations"]}
            index={0}
          />
          <ToolHighlight
            icon={<Files className="h-7 w-7" />}
            title="Merge Excel"
            features={["Gabungkan beberapa file", "Gabungkan antar sheet", "Pemetaan kolom otomatis", "Dukung format XLSX & CSV", "Tanpa batas ukuran file"]}
            index={1}
          />
          <ToolHighlight
            icon={<Scissors className="h-7 w-7" />}
            title="Split Worksheet"
            features={["Pecah berdasarkan kolom", "Pecah per jumlah baris", "Ekspor ke file terpisah", "Pertahankan format asli", "Otomasi penamaan file"]}
            index={2}
          />
          <ToolHighlight
            icon={<ClipboardEdit className="h-7 w-7" />}
            title="Data Entry Form"
            features={["UI Form yang bersih", "Validasi data otomatis", "Input data panjang mudah", "Sinkronisasi real-time", "Custom input field"]}
            index={3}
          />
        </motion.div>

        {/* General features */}
        <motion.div
          className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <FeatureCard
            icon={<Languages className="h-6 w-6" />}
            title="Bilingual Support"
            description="Tulis dalam Bahasa Indonesia atau English, AI mengerti keduanya dan menjawab dalam bahasa yang sama."
            index={0}
          />
          <FeatureCard
            icon={<MessageSquareText className="h-6 w-6" />}
            title="Natural Language"
            description="Jelaskan apa yang kamu mau seperti bicara dengan teman. AI paham konteksnya."
            index={1}
          />
          <FeatureCard
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Preview Before Apply"
            description="Lihat dulu hasilnya sebelum diterapkan. Yakin baru klik Apply."
            index={2}
          />
          <FeatureCard
            icon={<History className="h-6 w-6" />}
            title="Undo / Redo"
            description="Setiap perubahan bisa di-undo. Ctrl+Z dan Ctrl+Y berfungsi."
            index={3}
          />
          <FeatureCard
            icon={<Merge className="h-6 w-6" />}
            title="Multi-File Support"
            description="Upload dan gabungkan beberapa file sekaligus untuk PDF tools."
            index={4}
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Instant Download"
            description="Hasil langsung bisa didownload. Tidak perlu copy-paste manual."
            index={5}
          />
        </motion.div>
      </div>
    </section>
  );
};

const ToolHighlight = ({
  icon,
  title,
  features,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  features: string[];
  index: number;
}) => {
  // Color config for each tool: Excel (Green), PDF (Red), Docs (Blue)
  const colorConfig = [
    {
      bgGradient: "from-green-500/10 to-green-500/5",
      hoverBg: "from-green-500/20 to-green-500/10",
      iconGradient: "from-green-500 to-emerald-600",
      dotColor: "bg-green-500/60",
      borderColor: "hover:border-green-500/50"
    },
    {
      bgGradient: "from-blue-500/10 to-blue-500/5",
      hoverBg: "from-blue-500/20 to-blue-500/10",
      iconGradient: "from-blue-500 to-blue-600",
      dotColor: "bg-blue-500/60",
      borderColor: "hover:border-blue-500/50"
    },
    {
      bgGradient: "from-orange-500/10 to-orange-500/5",
      hoverBg: "from-orange-500/20 to-orange-500/10",
      iconGradient: "from-orange-500 to-orange-600",
      dotColor: "bg-orange-500/60",
      borderColor: "hover:border-orange-500/50"
    },
    {
      bgGradient: "from-purple-500/10 to-purple-500/5",
      hoverBg: "from-purple-500/20 to-purple-500/10",
      iconGradient: "from-purple-500 to-purple-600",
      dotColor: "bg-purple-500/60",
      borderColor: "hover:border-purple-500/50"
    },
  ];

  const colors = colorConfig[index];

  return (
    <motion.div
      className={`relative group rounded-xl sm:rounded-2xl border border-border/50 bg-gradient-to-br ${colors.bgGradient} p-5 sm:p-6 transition-all hover:shadow-xl backdrop-blur-sm ${colors.borderColor}`}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, delay: index * 0.1 },
        },
      }}
      whileHover={{ y: -5 }}
    >
      <motion.div
        className={`mb-3 sm:mb-4 inline-flex rounded-lg bg-gradient-to-br ${colors.iconGradient} p-2.5 sm:p-3 text-white group-hover:shadow-lg transition-all`}
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        {icon}
      </motion.div>
      <h3 className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold text-foreground">{title}</h3>
      <ul className="space-y-1.5 sm:space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
            <motion.div className={`h-1.5 w-1.5 rounded-full ${colors.dotColor} flex-shrink-0 mt-1`} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
  index = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  index?: number;
}) => {
  // Color variations for feature cards
  const cardColors = [
    "from-purple-500/10 to-purple-500/5 hover:border-purple-500/50 hover:from-purple-500/20",
    "from-cyan-500/10 to-cyan-500/5 hover:border-cyan-500/50 hover:from-cyan-500/20",
    "from-amber-500/10 to-amber-500/5 hover:border-amber-500/50 hover:from-amber-500/20",
    "from-pink-500/10 to-pink-500/5 hover:border-pink-500/50 hover:from-pink-500/20",
    "from-teal-500/10 to-teal-500/5 hover:border-teal-500/50 hover:from-teal-500/20",
    "from-violet-500/10 to-violet-500/5 hover:border-violet-500/50 hover:from-violet-500/20",
  ];

  const iconColors = [
    "from-purple-500 to-purple-600",
    "from-cyan-500 to-blue-600",
    "from-amber-500 to-orange-600",
    "from-pink-500 to-rose-600",
    "from-teal-500 to-emerald-600",
    "from-violet-500 to-purple-600",
  ];

  return (
    <motion.div
      className={`group rounded-xl sm:rounded-2xl border border-border/50 bg-gradient-to-br ${cardColors[index]} p-5 sm:p-6 transition-all hover:shadow-lg backdrop-blur-sm`}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, delay: index * 0.1 },
        },
      }}
      whileHover={{ y: -5 }}
    >
      <motion.div
        className={`mb-3 sm:mb-4 inline-flex rounded-lg bg-gradient-to-br ${iconColors[index]} p-2.5 sm:p-3 text-white transition-all`}
        whileHover={{ scale: 1.1, rotate: -5 }}
      >
        {icon}
      </motion.div>
      <h3 className="mb-2 text-base sm:text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
};

export default Features;
