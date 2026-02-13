import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Apakah file saya aman?",
      answer: "Ya, file kamu diproses secara lokal di browser dan tidak disimpan di server kami setelah sesi selesai. Kami hanya menyimpan riwayat chat untuk kemudahan kamu, bukan data file-nya."
    },
    {
      question: "Tools apa saja yang tersedia?",
      answer: "Saat ini tersedia Chat to Excel untuk manipulasi spreadsheet, termasuk formula, cleansing, transform, sort, filter, dan fitur lainnya."
    },
    {
      question: "Bisa bahasa Indonesia atau harus English?",
      answer: "Bisa keduanya! Chat to Edit mengerti Bahasa Indonesia dan English. Tulis saja seperti kamu bicara sehari-hari, AI akan paham maksud kamu."
    },
    {
      question: "Bagaimana cara kerjanya?",
      answer: "Upload file, lalu jelaskan apa yang kamu mau lewat chat. AI akan menganalisis file kamu, melakukan perubahan yang diminta, dan kamu bisa download hasilnya. Semua lewat chat."
    },
    {
      question: "Apakah hasilnya benar-benar berfungsi?",
      answer: "Ya! Untuk Excel, perubahan (termasuk formula) langsung diterapkan ke file .xlsx. Tinggal download dan pakai."
    },
    {
      question: "Apa yang terjadi kalau hasilnya salah?",
      answer: "Setiap perubahan bisa di-preview dulu sebelum diterapkan. Kalau sudah diterapkan, kamu bisa undo kapan saja. AI juga akan memberitahu kalau ada error."
    },
  ];

  return (
    <section id="faq" className="bg-background py-20">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pertanyaan yang Sering Ditanyakan
          </h2>
          <p className="text-lg text-muted-foreground">
            Belum ketemu jawabannya? Hubungi kami di support@chattoedit.com
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
