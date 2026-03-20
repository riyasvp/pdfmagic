import { Metadata } from "next";
import { Shield, Lock, Eye, Database, Server, UserCheck, FileText, Mail } from "lucide-react";
import { Header, Footer, MobileNav } from "@/components/pdf";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "PDFMagic Privacy Policy - Learn how we protect your data and privacy when using our free online PDF tools.",
};

export default function PrivacyPage() {
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20 mb-6">
              <Shield className="w-5 h-5 text-violet-500" />
              <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                Privacy First
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 gradient-text">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-lg">
              Last updated: March 20, 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div className="glass-card rounded-2xl p-6 md:p-8 space-y-8">
              
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-violet-500" />
                  Introduction
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  PDFMagic ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, products, and services (collectively, the "Services"). Please read this Privacy Policy carefully. By using our Services, you consent to the practices described in this policy.
                </p>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Database className="w-6 h-6 text-violet-500" />
                  Information We Collect
                </h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">A. Information You Provide</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li><strong>Account Information:</strong> When you create an account, we collect your name, email address, and password.</li>
                    <li><strong>Payment Information:</strong> If you purchase premium services, we collect payment details through our payment processor, Stripe.</li>
                    <li><strong>Communications:</strong> When you contact us, we collect your name, email address, and the content of your message.</li>
                  </ul>

                  <h3 className="text-lg font-semibold">B. Information Collected Automatically</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li><strong>Usage Data:</strong> We collect information about how you interact with our Services, including pages visited, features used, and time spent.</li>
                    <li><strong>Device Information:</strong> We collect device type, operating system, browser type, and unique device identifiers.</li>
                    <li><strong>Log Data:</strong> Our servers automatically log information including IP address, access times, and pages viewed.</li>
                  </ul>

                  <h3 className="text-lg font-semibold">C. Files You Process</h3>
                  <p className="text-muted-foreground">
                    <strong>Important:</strong> We use client-side processing, meaning your PDF files are processed entirely in your browser. Your files are never uploaded to our servers unless you explicitly use our cloud features. When files are processed locally, we do not collect, store, or have access to the content of your files.
                  </p>
                </div>
              </section>

              {/* How We Use Information */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-violet-500" />
                  How We Use Your Information
                </h2>
                <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Provide, maintain, and improve our Services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send you technical notices, updates, and support messages</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Analyze usage patterns to improve user experience</li>
                  <li>Detect, prevent, and address technical issues</li>
                  <li>Protect against fraud and unauthorized access</li>
                  <li>Provide personalized features and recommendations</li>
                </ul>
              </section>

              {/* Data Sharing */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Server className="w-6 h-6 text-violet-500" />
                  Data Sharing and Disclosure
                </h2>
                <p className="text-muted-foreground mb-4">
                  We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Service Providers:</strong> We share information with trusted third-party service providers who assist us in operating our Services (e.g., hosting providers, analytics services).</li>
                  <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid requests by public authorities.</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
                  <li><strong>With Your Consent:</strong> We may share information with third parties when you explicitly consent to such sharing.</li>
                </ul>
              </section>

              {/* Data Security */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-violet-500" />
                  Data Security
                </h2>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
                  <li>SSL/TLS encryption for data in transit</li>
                  <li>Secure data centers with access controls</li>
                  <li>Regular security audits and assessments</li>
                  <li>Employee training on data protection</li>
                  <li>Limited access to personal information</li>
                </ul>
              </section>

              {/* Cookies */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-violet-500" />
                  Cookies and Tracking
                </h2>
                <p className="text-muted-foreground mb-4">
                  We use cookies and similar tracking technologies to collect and track information about your interactions with our Services. Cookies are small files stored on your device that help us remember your preferences and understand how you use our site.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">Essential Cookies</h4>
                    <p className="text-sm text-muted-foreground">Required for basic site functionality, cannot be disabled.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">Analytics Cookies</h4>
                    <p className="text-sm text-muted-foreground">Help us understand how visitors interact with our site.</p>
                  </div>
                </div>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-violet-500" />
                  Your Rights
                </h2>
                <p className="text-muted-foreground mb-4">You have the following rights regarding your personal information:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information.</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information.</li>
                  <li><strong>Portability:</strong> Request your data in a portable format.</li>
                  <li><strong>Objection:</strong> Object to certain processing of your information.</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  To exercise these rights, please contact us at <a href="mailto:privacy@pdfmagic.store" className="text-primary hover:underline">privacy@pdfmagic.store</a>.
                </p>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-violet-500" />
                  Children's Privacy
                </h2>
                <p className="text-muted-foreground">
                  Our Services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
                </p>
              </section>

              {/* Changes to Policy */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-violet-500" />
                  Changes to This Policy
                </h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically for any changes.
                </p>
              </section>

              {/* Contact */}
              <section className="bg-gradient-to-r from-violet-500/10 to-pink-500/10 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-violet-500" />
                  Contact Us
                </h2>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>Email:</strong> <a href="mailto:privacy@pdfmagic.store" className="text-primary hover:underline">privacy@pdfmagic.store</a></p>
                  <p><strong>Website:</strong> <Link href="/contact" className="text-primary hover:underline">www.pdfmagic.store/contact</Link></p>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
