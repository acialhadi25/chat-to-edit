import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16 px-4">
        <div className="mx-auto max-w-3xl prose prose-sm dark:prose-invert">
          <h1 className="text-3xl font-bold text-foreground mb-8">Syarat dan Ketentuan</h1>
          <p className="text-sm text-muted-foreground mb-8">Terakhir diperbarui: 12 Februari 2026</p>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-foreground">1. Penerimaan Syarat</h2>
            <p className="text-muted-foreground leading-relaxed">
              Dengan mengakses dan menggunakan layanan Chat to Edit, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak setuju, mohon untuk tidak menggunakan layanan kami.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-foreground">2. Deskripsi Layanan</h2>
            <p className="text-muted-foreground leading-relaxed">
              Chat to Edit menyediakan platform berbasis AI untuk mengedit dan mengelola data Excel melalui antarmuka chat. Layanan ini tersedia dalam paket gratis dan berbayar dengan batasan penggunaan yang berbeda.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-foreground">3. Akun Pengguna</h2>
            <p className="text-muted-foreground leading-relaxed">
              Anda bertanggung jawab untuk menjaga kerahasiaan akun dan kata sandi Anda. Anda setuju untuk memberikan informasi yang akurat dan terkini saat mendaftar. Anda bertanggung jawab atas semua aktivitas yang terjadi di bawah akun Anda.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-foreground">4. Penggunaan yang Diperbolehkan</h2>
            <p className="text-muted-foreground leading-relaxed">
              Anda setuju untuk menggunakan layanan hanya untuk tujuan yang sah dan tidak melanggar hukum. Dilarang menggunakan layanan untuk mengunggah konten yang melanggar hak cipta, mengandung malware, atau melanggar privasi orang lain.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-foreground">5. Batasan Penggunaan</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pengguna paket gratis dibatasi hingga 5 file per bulan. Pengguna paket Pro dapat memproses hingga 50 file per bulan. Batasan ini dapat berubah sewaktu-waktu dengan pemberitahuan sebelumnya.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-foreground">6. Hak Kekayaan Intelektual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Seluruh konten dan teknologi yang ada di platform Chat to Edit dilindungi oleh hak cipta dan hukum kekayaan intelektual yang berlaku. Anda mempertahankan kepemilikan atas file dan dokumen yang Anda unggah.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-foreground">7. Batasan Tanggung Jawab</h2>
            <p className="text-muted-foreground leading-relaxed">
              Layanan disediakan "sebagaimana adanya" tanpa jaminan apapun. Kami tidak bertanggung jawab atas kerugian yang timbul dari penggunaan layanan, termasuk namun tidak terbatas pada kehilangan data atau kerusakan file.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Perubahan Syarat</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kami berhak mengubah syarat dan ketentuan ini kapan saja. Perubahan akan berlaku setelah dipublikasikan di halaman ini. Penggunaan layanan setelah perubahan dianggap sebagai persetujuan Anda.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
