import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16 px-4">
        <div className="mx-auto max-w-3xl prose prose-sm dark:prose-invert">
          <h1 className="text-3xl font-bold text-foreground mb-8">Kebijakan Privasi</h1>
          <p className="text-sm text-muted-foreground mb-8">Terakhir diperbarui: 12 Februari 2026</p>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-foreground">1. Informasi yang Kami Kumpulkan</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kami mengumpulkan informasi yang Anda berikan secara langsung, termasuk nama, alamat email, dan data yang Anda unggah ke platform kami (file Excel, PDF, dan dokumen). Kami juga mengumpulkan data penggunaan secara otomatis seperti alamat IP, jenis browser, dan pola penggunaan layanan.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-foreground">2. Penggunaan Informasi</h2>
            <p className="text-muted-foreground leading-relaxed">
              Informasi yang kami kumpulkan digunakan untuk menyediakan dan meningkatkan layanan kami, memproses permintaan Anda, mengirimkan notifikasi terkait layanan, dan menjaga keamanan platform.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-foreground">3. Penyimpanan & Keamanan Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              File yang Anda unggah diproses secara real-time dan tidak disimpan secara permanen di server kami setelah sesi berakhir. Kami menggunakan enkripsi SSL/TLS untuk melindungi data dalam transmisi dan menerapkan praktik keamanan standar industri.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-foreground">4. Berbagi Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kami tidak menjual, memperdagangkan, atau menyewakan informasi pribadi Anda kepada pihak ketiga. Kami dapat membagikan informasi hanya jika diwajibkan oleh hukum atau untuk melindungi hak dan keamanan platform.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-foreground">5. Cookie</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kami menggunakan cookie untuk menjaga sesi login Anda dan menganalisis penggunaan layanan. Anda dapat mengatur preferensi cookie melalui pengaturan browser Anda.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-foreground">6. Hak Anda</h2>
            <p className="text-muted-foreground leading-relaxed">
              Anda memiliki hak untuk mengakses, memperbarui, atau menghapus data pribadi Anda. Hubungi kami melalui halaman kontak untuk mengajukan permintaan terkait data Anda.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Kontak</h2>
            <p className="text-muted-foreground leading-relaxed">
              Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami melalui email di <a href="mailto:support@chattoedit.com" className="text-primary hover:underline">support@chattoedit.com</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
