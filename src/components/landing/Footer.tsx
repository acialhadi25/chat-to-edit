import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/30 py-12">
      <div className="container">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Pencil className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">Chat to Edit</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI-powered Excel management suite. Chat, Merge, Split, dan Data Entry.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Produk</h4>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-sm text-muted-foreground hover:text-foreground">Semua Produk</Link></li>
              <li><Link to="/dashboard/excel" className="text-sm text-muted-foreground hover:text-foreground">Chat to Excel</Link></li>
              <li><Link to="/dashboard/merge" className="text-sm text-muted-foreground hover:text-foreground">Merge Excel</Link></li>
              <li><Link to="/dashboard/split" className="text-sm text-muted-foreground hover:text-foreground">Split Worksheet</Link></li>
              <li><Link to="/dashboard/data-entry" className="text-sm text-muted-foreground hover:text-foreground">Data Entry Form</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Perusahaan</h4>
            <ul className="space-y-2">
              <li><a href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground">Harga</a></li>
              <li><a href="/#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</a></li>
              <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">Hubungi Kami</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Kebijakan Privasi</Link></li>
              <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">Syarat & Ketentuan</Link></li>
              <li><a href="mailto:support@chattoedit.com" className="text-sm text-muted-foreground hover:text-foreground">support@chattoedit.com</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Chat to Edit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
