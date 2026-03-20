import { Metadata } from "next";
import { FileText, Scale, AlertTriangle, User, Server, Pen, Mail, Clock, Shield } from "lucide-react";
import { Header, Footer, MobileNav } from "@/components/pdf";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "PDFMagic Terms of Service - Read our terms and conditions for using our free online PDF tools and services.",
};

export default function TermsPage() {
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
              <Scale className="w-5 h-5 text-violet-500" />
              <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                Legal
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 gradient-text">
              Terms of Service
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
                  1. Acceptance of Terms
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to PDFMagic. By accessing or using our website and services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Services. These Terms constitute a legally binding agreement between you and PDFMagic.
                </p>
              </section>

              {/* Description of Services */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Server className="w-6 h-6 text-violet-500" />
                  2. Description of Services
                </h2>
                <p className="text-muted-foreground mb-4">
                  PDFMagic provides online PDF tools including but not limited to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>PDF merge and split tools</li>
                  <li>PDF compression and optimization</li>
                  <li>PDF to Word, Excel, PowerPoint conversion</li>
                  <li>Image to PDF conversion</li>
                  <li>PDF editing tools (watermark, rotate, delete pages)</li>
                  <li>OCR (Optical Character Recognition)</li>
                  <li>PDF security and protection features</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  We reserve the right to modify, suspend, or discontinue any aspect of our Services at any time without prior notice.
                </p>
              </section>

              {/* User Accounts */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <User className="w-6 h-6 text-violet-500" />
                  3. User Accounts
                </h2>
                <p className="text-muted-foreground mb-4">When you create an account with us, you agree to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your information to keep it accurate</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.
                </p>
              </section>

              {/* Acceptable Use */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-violet-500" />
                  4. Acceptable Use
                </h2>
                <p className="text-muted-foreground mb-4">You agree NOT to use our Services to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Upload or process illegal, harmful, or offensive content</li>
                  <li>Violate any intellectual property rights or copyrights</li>
                  <li>Upload or transmit viruses, malware, or malicious code</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use automated bots or scrapers without permission</li>
                  <li>Interfere with or disrupt our servers or networks</li>
                  <li>Collect user information without consent</li>
                  <li>Engage in any activity that could damage or disable our Services</li>
                </ul>
              </section>

              {/* Content and Ownership */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Pen className="w-6 h-6 text-violet-500" />
                  5. Content and Ownership
                </h2>
                <p className="text-muted-foreground mb-4">
                  <strong>Your Content:</strong> You retain all rights to the files and content you upload to our Services. By using our Services, you grant us a limited license to process your files solely for the purpose of providing the requested service.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>Our Content:</strong> All content, designs, logos, and materials on our website are owned by PDFMagic and are protected by intellectual property laws. You may not copy, modify, or distribute our content without written permission.
                </p>
                <p className="text-muted-foreground">
                  <strong>Service Content:</strong> Our Services are protected by copyright, trademark, and other intellectual property laws. The software, algorithms, and processes used to provide our Services are proprietary to PDFMagic.
                </p>
              </section>

              {/* Privacy and Data */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-violet-500" />
                  6. Privacy and Data Processing
                </h2>
                <p className="text-muted-foreground mb-4">
                  Your privacy is important to us. Please review our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> to understand how we collect, use, and protect your information. By using our Services, you consent to our data practices as described in the Privacy Policy.
                </p>
                <p className="text-muted-foreground">
                  Files processed through our client-side tools are handled entirely in your browser and are not uploaded to our servers. For cloud-based features, we implement appropriate security measures to protect your data.
                </p>
              </section>

              {/* Payment and Billing */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-violet-500" />
                  7. Payment and Billing
                </h2>
                <p className="text-muted-foreground mb-4">
                  <strong>Free Services:</strong> Basic PDF tools are provided free of charge with no payment required.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>Premium Services:</strong> Some features require a paid subscription. Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law.
                </p>
                <p className="text-muted-foreground">
                  <strong>Price Changes:</strong> We reserve the right to change our pricing at any time. Price changes will be communicated via email or notice on our website.
                </p>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-violet-500" />
                  8. Limitation of Liability
                </h2>
                <p className="text-muted-foreground mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, PDFMAGIC AND ITS AFFILIATES SHALL NOT BE LIABLE FOR:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Loss of profits, revenue, data, or business opportunities</li>
                  <li>Any damages resulting from loss of use, data, or goodwill</li>
                  <li>Any errors, bugs, or inaccuracies in our Services</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Our total liability for any claims arising from these Terms or our Services shall not exceed the amount you paid us (if any) in the twelve (12) months preceding the claim.
                </p>
              </section>

              {/* Disclaimer of Warranties */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-violet-500" />
                  9. Disclaimer of Warranties
                </h2>
                <p className="text-muted-foreground mb-4">
                  OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Our Services will be uninterrupted, secure, or error-free</li>
                  <li>The results from using our Services will be accurate or reliable</li>
                  <li>The quality of any services will meet your expectations</li>
                  <li>Any errors in the Service will be corrected</li>
                </ul>
              </section>

              {/* Indemnification */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-violet-500" />
                  10. Indemnification
                </h2>
                <p className="text-muted-foreground">
                  You agree to indemnify, defend, and hold harmless PDFMagic and its affiliates from any claims, damages, losses, or expenses (including legal fees) arising from: (a) your use of our Services; (b) your violation of these Terms; or (c) your violation of any rights of a third party.
                </p>
              </section>

              {/* Modifications to Terms */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-violet-500" />
                  11. Modifications to Terms
                </h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page with a new "Last updated" date. Your continued use of our Services after such modifications constitutes your acceptance of the updated Terms. We encourage you to review these Terms periodically.
                </p>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-violet-500" />
                  12. Termination
                </h2>
                <p className="text-muted-foreground mb-4">
                  You may terminate your account at any time by contacting us or using the account deletion feature. We may terminate or suspend your access to our Services immediately, without prior notice, for any reason including breach of these Terms.
                </p>
                <p className="text-muted-foreground">
                  Upon termination, your right to use our Services will cease immediately. Sections that by their nature should survive termination (including ownership, warranties, indemnification, liability limitations) shall survive.
                </p>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Scale className="w-6 h-6 text-violet-500" />
                  13. Governing Law
                </h2>
                <p className="text-muted-foreground">
                  These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of our Services shall be resolved in the courts of the United States, and you consent to the personal jurisdiction of such courts.
                </p>
              </section>

              {/* Contact Information */}
              <section className="bg-gradient-to-r from-violet-500/10 to-pink-500/10 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-violet-500" />
                  Contact Information
                </h2>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>Email:</strong> <a href="mailto:legal@pdfmagic.store" className="text-primary hover:underline">legal@pdfmagic.store</a></p>
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
