"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, HelpCircle, ChevronDown, FileText, Shield, Clock, Cloud, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header, Footer, MobileNav } from "@/components/pdf";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    question: "How do I merge PDF files?",
    answer: "To merge PDF files, go to the Merge PDF tool page. Click the upload area or drag and drop your PDF files. You can reorder the files by dragging them. Once you're satisfied with the order, click the 'Merge PDF' button. Your files will be combined into a single PDF document that you can download instantly.",
    category: "Getting Started",
  },
  {
    question: "Are my files stored on your servers?",
    answer: "No, your files are processed entirely in your browser. PDFMagic uses client-side processing, which means your files never leave your device. This makes our service more secure and faster than server-based alternatives. Your privacy is our top priority.",
    category: "Privacy & Security",
  },
  {
    question: "Is PDFMagic free to use?",
    answer: "Yes! PDFMagic offers 100% free access to all our PDF tools. You don't need to create an account or pay anything. All features are available without limitations. We generate revenue through optional premium features and non-intrusive advertisements.",
    category: "Pricing",
  },
  {
    question: "What file formats are supported?",
    answer: "PDFMagic supports PDF files for all tools. For conversion tools, we also support formats like Word (.docx), Excel (.xlsx), PowerPoint (.pptx), Images (JPG, PNG, GIF, WebP, BMP), Text files (.txt), and HTML files. We're constantly adding support for more formats.",
    category: "Technical",
  },
  {
    question: "How do I split a PDF file?",
    answer: "Use our Split PDF tool to divide a PDF into multiple files. You can split by specific page numbers (e.g., pages 1-5, 10-15), split at every N pages, extract individual pages, or remove specific pages. Upload your PDF and choose your preferred split method.",
    category: "Getting Started",
  },
  {
    question: "Can I compress a PDF to reduce file size?",
    answer: "Yes, our Compress PDF tool reduces file size while maintaining quality. Choose from compression levels: 'Low' for minimal reduction with best quality, 'Medium' for balanced compression, or 'High' for maximum compression. Preview the before/after file sizes before downloading.",
    category: "Getting Started",
  },
  {
    question: "Do you offer an API for developers?",
    answer: "Yes, we offer a professional API for developers who want to integrate PDF tools into their applications. Our API supports all major programming languages and includes comprehensive documentation, code examples, and dedicated support. Visit our API documentation for more details.",
    category: "Technical",
  },
  {
    question: "How do I convert a PDF to Word?",
    answer: "Upload your PDF file to our PDF to Word converter. Our advanced OCR technology preserves formatting, fonts, and layout. Once processed, download your editable .docx file. The conversion quality depends on the original PDF's complexity and text vs. image content.",
    category: "Conversion",
  },
  {
    question: "Is my data secure when using PDFMagic?",
    answer: "Absolutely! We implement industry-standard security measures including SSL encryption, secure file handling, and automatic file deletion after processing. Our servers don't store your files - all processing happens locally in your browser using WebAssembly technology.",
    category: "Privacy & Security",
  },
  {
    question: "Can I use PDFMagic on my mobile device?",
    answer: "Yes! PDFMagic is fully responsive and works great on smartphones and tablets. You can access all tools through your mobile browser. We're also working on native mobile apps for iOS and Android that will offer an even better experience.",
    category: "Getting Started",
  },
  {
    question: "How do I add a watermark to my PDF?",
    answer: "Use the Watermark PDF tool to add text or image watermarks. You can customize watermark properties including text content, font, size, color, opacity, and position. Apply watermarks to a single page or all pages. Great for adding company logos or confidential labels.",
    category: "Editing",
  },
  {
    question: "What payment methods do you accept for premium?",
    answer: "For our premium features, we accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, and Google Pay. All transactions are processed securely through Stripe. Subscriptions can be cancelled anytime with no cancellation fees.",
    category: "Pricing",
  },
];

const categories = ["All", "Getting Started", "Privacy & Security", "Pricing", "Technical", "Conversion", "Editing"];

const quickHelp = [
  { icon: FileText, title: "Getting Started", description: "Learn the basics of using PDFMagic", href: "/help" },
  { icon: Shield, title: "Privacy & Security", description: "Understand how we protect your data", href: "/privacy" },
  { icon: Clock, title: "Processing Times", description: "Fast processing for all your files", href: "/help" },
  { icon: Cloud, title: "No Upload Required", description: "All processing happens in your browser", href: "/help" },
  { icon: Users, title: "Collaboration", description: "Share and collaborate on PDFs", href: "/help" },
  { icon: Mail, title: "Contact Us", description: "Get help from our support team", href: "/contact" },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-20 md:pb-0">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950" />
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-pink-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <Header />

      <main className="pt-24 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20 mb-6">
            <HelpCircle className="w-5 h-5 text-violet-500" />
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
              Help Center
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 gradient-text">
            How can we help you?
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Search our knowledge base or browse frequently asked questions below.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 md:h-14 rounded-xl bg-white/80 dark:bg-slate-800/80 border-violet-200 dark:border-violet-800 focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </motion.div>

        {/* Quick Help Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12"
        >
          {quickHelp.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="glass-card rounded-xl p-4 text-center hover:scale-105 transition-transform cursor-pointer"
            >
              <item.icon className="w-6 h-6 mx-auto mb-2 text-violet-500" />
              <h3 className="font-medium text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </a>
          ))}
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "rounded-full",
                selectedCategory === category && "btn-gradient text-white"
              )}
            >
              {category}
            </Button>
          ))}
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-3xl mx-auto space-y-4"
        >
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or browse all categories.
              </p>
            </div>
          ) : (
            filteredFAQs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                      {faq.category}
                    </span>
                    <span className="font-medium">{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform duration-200",
                      expandedIndex === index && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    expandedIndex === index ? "max-h-96" : "max-h-0"
                  )}
                >
                  <div className="px-6 pb-4 text-muted-foreground">
                    {faq.answer}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-3xl mx-auto mt-12"
        >
          <div className="glass-card rounded-2xl p-8 text-center bg-gradient-to-r from-violet-500/5 to-pink-500/5">
            <Mail className="w-12 h-12 mx-auto mb-4 text-violet-500" />
            <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <Button asChild className="btn-gradient text-white rounded-full px-8">
              <a href="/contact">Contact Support</a>
            </Button>
          </div>
        </motion.div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
