import Link from "next/link";
import { FileText, Github, Twitter, Linkedin, Mail, Heart } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  tools: [
    { name: "Merge PDF", href: "/tool/merge" },
    { name: "Split PDF", href: "/tool/split" },
    { name: "Compress PDF", href: "/tool/compress" },
    { name: "PDF to Word", href: "/tool/pdf-to-word" },
    { name: "Image to PDF", href: "/tool/image-to-pdf" },
  ],
  company: [
    { name: "About Us", href: "#" },
    { name: "Contact", href: "#" },
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
  ],
  resources: [
    { name: "Help Center", href: "#" },
    { name: "Blog", href: "#" },
    { name: "API Docs", href: "#" },
    { name: "Status", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="relative mt-20">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-violet-100/50 to-transparent dark:from-violet-950/30 pointer-events-none" />
      
      <div className="relative glass-card rounded-t-3xl">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold gradient-text">PDFMagic</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4">
                Your all-in-one PDF toolkit. Fast, secure, and easy to use.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-white transition-all duration-300">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-white transition-all duration-300">
                  <Github className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-white transition-all duration-300">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-white transition-all duration-300">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Tools */}
            <div>
              <h3 className="font-semibold mb-4">PDF Tools</h3>
              <ul className="space-y-2">
                {footerLinks.tools.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PDFMagic. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for better document management
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
