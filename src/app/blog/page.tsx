"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, User, ArrowRight, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header, Footer, MobileNav } from "@/components/pdf";
import { cn } from "@/lib/utils";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
  featured?: boolean;
}

const blogPosts: BlogPost[] = [
  {
    slug: "how-to-merge-pdfs",
    title: "How to Merge PDF Files: A Complete Guide",
    excerpt: "Learn step-by-step how to combine multiple PDF files into one document. Perfect for merging contracts, reports, and presentations.",
    content: "",
    author: "Sarah Chen",
    authorRole: "PDF Expert",
    date: "March 15, 2026",
    readTime: "5 min read",
    category: "Tutorial",
    image: "/blog/merge-pdfs.jpg",
    featured: true,
  },
  {
    slug: "best-pdf-tools-2024",
    title: "Top 10 Best PDF Tools for Business in 2026",
    excerpt: "Discover the most powerful and efficient PDF tools that can streamline your document workflow and boost productivity.",
    content: "",
    author: "Michael Rodriguez",
    authorRole: "Productivity Specialist",
    date: "March 10, 2026",
    readTime: "8 min read",
    category: "Productivity",
    image: "/blog/best-pdf-tools.jpg",
  },
  {
    slug: "compress-pdf-guide",
    title: "How to Compress PDF Files Without Losing Quality",
    excerpt: "Reduce your PDF file size significantly while maintaining excellent quality. Learn the best compression techniques.",
    content: "",
    author: "Emily Watson",
    authorRole: "Tech Writer",
    date: "March 5, 2026",
    readTime: "6 min read",
    category: "Tutorial",
    image: "/blog/compress-pdf.jpg",
  },
  {
    slug: "pdf-security-tips",
    title: "PDF Security: How to Protect Your Sensitive Documents",
    excerpt: "Essential tips for securing your PDFs with passwords, encryption, and digital signatures.",
    content: "",
    author: "David Kim",
    authorRole: "Security Expert",
    date: "February 28, 2026",
    readTime: "7 min read",
    category: "Security",
    image: "/blog/pdf-security.jpg",
  },
  {
    slug: "ocr-for-scanned-documents",
    title: "OCR Explained: Making Scanned Documents Searchable",
    excerpt: "Understand how OCR technology works and how it can transform your scanned documents into searchable, editable files.",
    content: "",
    author: "Sarah Chen",
    authorRole: "PDF Expert",
    date: "February 20, 2026",
    readTime: "6 min read",
    category: "Technology",
    image: "/blog/ocr-guide.jpg",
  },
];

const categories = ["All", "Tutorial", "Productivity", "Security", "Technology"];

export default function BlogPage() {
  const featuredPost = blogPosts.find((post) => post.featured);
  const regularPosts = blogPosts.filter((post) => !post.featured);

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
            <FileText className="w-5 h-5 text-violet-500" />
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
              PDFMagic Blog
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 gradient-text">
            Insights & Tutorials
          </h1>
          <p className="text-muted-foreground text-lg">
            Expert tips, how-to guides, and the latest news about PDF tools and document management.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search articles..."
              className="pl-12 h-12 rounded-xl bg-white/80 dark:bg-slate-800/80 border-violet-200 dark:border-violet-800"
            />
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === "All" ? "default" : "outline"}
              className={cn(
                "rounded-full",
                category === "All" && "btn-gradient text-white"
              )}
            >
              {category}
            </Button>
          ))}
        </motion.div>

        {/* Featured Post */}
        {featuredPost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <Link href={`/blog/${featuredPost.slug}`} className="group block">
              <div className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="aspect-video md:aspect-auto bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center p-8">
                    <FileText className="w-24 h-24 text-white/50" />
                  </div>
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 mb-4 w-fit">
                      {featuredPost.category}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {featuredPost.author}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {featuredPost.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {featuredPost.readTime}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* All Posts Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {regularPosts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Link href={`/blog/${post.slug}`} className="group block h-full">
                <article className="glass-card rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  <div className="aspect-video bg-gradient-to-br from-violet-500/80 to-purple-600/80 flex items-center justify-center">
                    <FileText className="w-12 h-12 text-white/30" />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 mb-3 w-fit">
                      {post.category}
                    </span>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{post.author}</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Newsletter CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16"
        >
          <div className="glass-card rounded-2xl p-8 md:p-12 text-center bg-gradient-to-r from-violet-500/10 to-pink-500/10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Stay Updated
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get the latest PDF tips and tutorials delivered to your inbox. No spam, unsubscribe anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-xl"
              />
              <Button className="btn-gradient text-white rounded-xl px-6">
                Subscribe
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
