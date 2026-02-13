import { motion } from "framer-motion";
import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Budi Santoso",
      role: "Content Creator",
      avatar: "BS",
      content:
        "Sangat membantu menghemat waktu saat editing dokumen. AI-nya paham apa yang saya mau tanpa perlu dijelaskan detail.",
      rating: 5,
    },
    {
      name: "Siti Nurhaliza",
      role: "Business Owner",
      avatar: "SN",
      content:
        "Dulu butuh 2-3 jam untuk mengedit file Excel. Sekarang bisa selesai dalam 5 menit. Game changer banget!",
      rating: 5,
    },
    {
      name: "Ahmad Wijaya",
      role: "Student",
      avatar: "AW",
      content:
        "Perfect untuk tugas kuliah. Bisa rapihin data Excel dengan cepat dan hasil outputnya rapi. Recommended!",
      rating: 5,
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
    <section className="relative py-24 bg-gradient-to-b from-background to-accent/30">
      <div className="container">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="mb-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            Dipercaya oleh Jutaan Pengguna
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Lihat apa kata pengguna kami tentang Chat to Edit
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm hover:shadow-lg transition-shadow"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-sm text-foreground mb-6 leading-relaxed italic">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-white text-xs font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
