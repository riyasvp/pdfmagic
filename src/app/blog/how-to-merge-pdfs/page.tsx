import Link from "next/link";
import { Calendar, Clock, User, ArrowLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header, Footer, MobileNav } from "@/components/pdf";
import { ShareButtons, FloatingShareBar } from "@/components/ShareButtons";

export default function HowToMergePDFsPage() {
  const currentUrl = "https://pdfmagic.store/blog/how-to-merge-pdfs";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Merge PDF Files: A Complete Guide",
    description: "Learn step-by-step how to combine multiple PDF files into one document.",
    author: {
      "@type": "Person",
      name: "Sarah Chen",
      jobTitle: "PDF Expert",
    },
    publisher: {
      "@type": "Organization",
      name: "PDFMagic",
      logo: {
        "@type": "ImageObject",
        url: "https://pdfmagic.store/favicon.svg",
      },
    },
    datePublished: "2026-03-15",
    dateModified: "2026-03-15",
  };

  const relatedPosts = [
    {
      slug: "compress-pdf-guide",
      title: "How to Compress PDF Files Without Losing Quality",
    },
    {
      slug: "best-pdf-tools-2024",
      title: "Top 10 Best PDF Tools for Business in 2026",
    },
    {
      slug: "pdf-security-tips",
      title: "PDF Security: How to Protect Your Sensitive Documents",
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen relative overflow-hidden pb-20 md:pb-0">
        {/* Animated gradient background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950" />
          <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        </div>

        <Header />

        <FloatingShareBar url={currentUrl} title="How to Merge PDF Files: A Complete Guide" />

        <main className="pt-24 container mx-auto px-4 py-8">
          <article className="max-w-3xl mx-auto">
            {/* Back to Blog */}
            <div className="mb-8">
              <Link href="/blog">
                <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Blog
                </Button>
              </Link>
            </div>

            {/* Article Header */}
            <header className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                  <Tag className="w-3 h-3" />
                  Tutorial
                </span>
                <span className="text-sm text-muted-foreground">
                  5 min read
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                How to Merge PDF Files: A Complete Guide
              </h1>

              <p className="text-lg text-muted-foreground mb-6">
                Learn step-by-step how to combine multiple PDF files into one document. Perfect for merging contracts, reports, and presentations.
              </p>

              <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    SC
                  </div>
                  <div>
                    <p className="font-medium">Sarah Chen</p>
                    <p className="text-sm text-muted-foreground">PDF Expert</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    March 15, 2026
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    5 min read
                  </div>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="mt-6">
                <p className="text-sm font-medium mb-2">Share this article:</p>
                <ShareButtons
                  url={currentUrl}
                  title="How to Merge PDF Files: A Complete Guide"
                  description="Learn step-by-step how to combine multiple PDF files into one document."
                  size="lg"
                  showLabel
                />
              </div>
            </header>

            {/* Article Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
                
                <p className="lead text-xl text-muted-foreground">
                  Merging PDF files is one of the most common document management tasks. Whether you're combining contracts, merging report sections, or assembling a presentation, PDFMagic makes it simple and free.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4">Why Merge PDF Files?</h2>
                <p>
                  There are many reasons you might need to combine PDF documents:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Contracts and legal documents</strong> - Combine multiple pages or sections into a single file for easier signing and sharing</li>
                  <li><strong>Reports and proposals</strong> - Merge cover pages, content sections, and appendices</li>
                  <li><strong>Presentations</strong> - Combine slides from different sources</li>
                  <li><strong>Archives</strong> - Organize related documents into logical groupings</li>
                  <li><strong>Efficiency</strong> - Reduce email clutter by sending one file instead of many</li>
                </ul>

                <h2 className="text-2xl font-bold mt-8 mb-4">How to Merge PDFs with PDFMagic</h2>
                
                <h3 className="text-xl font-semibold">Step 1: Access the Merge Tool</h3>
                <p>
                  Navigate to <Link href="/tool/merge" className="text-primary hover:underline">PDFMagic's Merge PDF tool</Link>. Our tool works entirely in your browser, so your files never leave your device.
                </p>

                <h3 className="text-xl font-semibold">Step 2: Upload Your PDF Files</h3>
                <p>
                  Click the upload area or drag and drop your PDF files. You can select multiple files at once. We support any number of files, though for best performance we recommend keeping it under 50 files.
                </p>

                <h3 className="text-xl font-semibold">Step 3: Reorder Files (Optional)</h3>
                <p>
                  Once uploaded, you can drag and drop the files to reorder them. The order you set here will be the order in the final merged document. This is especially useful when combining pages from different sources.
                </p>

                <h3 className="text-xl font-semibold">Step 4: Merge and Download</h3>
                <p>
                  Click the "Merge PDF" button. Within seconds, your combined PDF will be ready. Click the download button to save your new file.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4">Pro Tips</h2>
                
                <div className="bg-gradient-to-r from-violet-500/10 to-pink-500/10 rounded-xl p-6">
                  <h3 className="font-bold mb-3">💡 Optimize Before Merging</h3>
                  <p className="text-muted-foreground">
                    If you're merging large files, consider compressing them first. Use our <Link href="/tool/compress" className="text-primary hover:underline">Compress PDF tool</Link> to reduce file sizes without significant quality loss.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-violet-500/10 to-pink-500/10 rounded-xl p-6">
                  <h3 className="font-bold mb-3">💡 Preview First</h3>
                  <p className="text-muted-foreground">
                    Always preview your merged document to ensure all pages are in the correct order and no pages are missing.
                  </p>
                </div>

                <h2 className="text-2xl font-bold mt-8 mb-4">Common Use Cases</h2>

                <h3 className="text-xl font-semibold">Legal Documents</h3>
                <p>
                  Law firms often need to combine multiple exhibits, affidavits, and contract sections. Merge PDF allows you to assemble complete case files quickly.
                </p>

                <h3 className="text-xl font-semibold">Business Reports</h3>
                <p>
                  Create comprehensive reports by merging executive summaries, data sections, charts, and appendices into one professional document.
                </p>

                <h3 className="text-xl font-semibold">Academic Papers</h3>
                <p>
                  Combine thesis chapters, bibliography, and appendices into a complete document ready for submission.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4">Security and Privacy</h2>
                <p>
                  At PDFMagic, your privacy is our priority. Our merge tool processes everything locally in your browser using JavaScript and WebAssembly. Your files are never uploaded to our servers, ensuring complete privacy.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4">Get Started</h2>
                <p>
                  Ready to merge your PDFs? <Link href="/tool/merge" className="text-primary hover:underline">Try PDFMagic's Merge PDF tool</Link> now - it's free, fast, and works on any device.
                </p>

              </div>
            </div>

            {/* Related Posts */}
            <div className="mt-12 pt-8 border-t border-border">
              <h3 className="text-xl font-bold mb-6">Related Articles</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {relatedPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group"
                  >
                    <article className="glass-card rounded-xl p-4 hover:shadow-lg transition-all">
                      <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                    </article>
                  </Link>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12">
              <div className="glass-card rounded-2xl p-8 text-center bg-gradient-to-r from-violet-500/10 to-pink-500/10">
                <h3 className="text-2xl font-bold mb-4">Ready to merge your PDFs?</h3>
                <p className="text-muted-foreground mb-6">
                  Try PDFMagic free - no signup required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/tool/merge">
                    <Button className="btn-gradient text-white rounded-full px-8">
                      Merge PDFs Now
                    </Button>
                  </Link>
                  <Link href="/blog">
                    <Button variant="outline" className="rounded-full px-8">
                      More Articles
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </main>

        <Footer />
        <MobileNav />
      </div>
    </>
  );
}
