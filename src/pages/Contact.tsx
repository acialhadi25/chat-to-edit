import { useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Loader2 } from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast({ title: "Error", description: "Semua field harus diisi", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: form.name.trim().slice(0, 100),
        email: form.email.trim().slice(0, 255),
        subject: form.subject.trim().slice(0, 200),
        message: form.message.trim().slice(0, 2000),
      });

      if (error) throw error;

      toast({ title: "Terkirim!", description: "Pesan Anda telah berhasil dikirim. Kami akan merespons segera." });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast({ title: "Gagal", description: "Terjadi kesalahan saat mengirim pesan. Coba lagi nanti.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">Hubungi Kami</h1>
            <p className="text-muted-foreground">
              Punya pertanyaan atau masukan? Kami senang mendengar dari Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  placeholder="Nama lengkap"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={100}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@contoh.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  maxLength={255}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subjek</Label>
              <Input
                id="subject"
                placeholder="Subjek pesan"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                maxLength={200}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Pesan</Label>
              <Textarea
                id="message"
                placeholder="Tulis pesan Anda di sini..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={6}
                maxLength={2000}
                required
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Kirim Pesan
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Atau hubungi kami langsung di <a href="mailto:support@chattoedit.com" className="text-primary hover:underline">support@chattoedit.com</a></p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
