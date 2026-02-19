"use client";

import { motion } from "framer-motion";
import { Sparkles, Zap, Shield, Globe, ArrowRight, Star, Users, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header, Footer, CategorySection, ToolCard } from "@/components/pdf";
import { toolCategories, getPopularTools } from "@/lib/tools-config";

export default function HomePage() {
  const popularTools = getPopularTools();

  const stats = [
    { icon: Users, value: "10M+", label: "Users worldwide" },
    { icon: FileCheck, value: "500M+", label: "Files processed" },
    { icon: Star, value: "4.9/5", label: "User rating" },
    { icon: Globe, value: "150+", label: "Countries" },
  ];

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Process your PDFs in seconds with our optimized cloud infrastructure",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your files are encrypted and automatically deleted after processing",
    },
    {
      icon: Globe,
      title: "Works Everywhere",
      description: "Access from any device - desktop, tablet, or mobile browser",
    },
    {
      icon: Sparkles,
      title: "AI Powered",
      description: "Advanced algorithms ensure the best quality output every time",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950" />
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-pink-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <Header />

      <main className="pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                Trusted by 10 million users worldwide
              </span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Every PDF Tool You Need{" "}
              <span className="gradient-text">In One Place</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Merge, split, compress, convert, and edit PDFs with ease. Fast, secure, and completely free online PDF tools.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="btn-gradient text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg shadow-violet-500/25"
                onClick={() => document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" })}
              >
                Explore All Tools
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 text-lg"
              >
                Watch Demo
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-16 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="text-center p-4 rounded-2xl glass-card"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl md:text-3xl font-bold gradient-text">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Popular Tools Section */}
        <section className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Most Popular Tools
            </h2>
            <p className="text-muted-foreground">
              Get started with our most used PDF tools
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularTools.map((tool, index) => (
              <ToolCard key={tool.id} {...tool} index={index} />
            ))}
          </div>
        </section>

        {/* All Tools by Category */}
        <section id="tools" className="container mx-auto px-4 py-8">
          {toolCategories.map((category, index) => (
            <CategorySection key={category.name} {...category} />
          ))}
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose PDFMagic?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make PDF management effortless
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6 text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 p-8 md:p-12 text-center text-white"
          >
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your PDFs?
              </h2>
              <p className="text-white/80 mb-8 max-w-2xl mx-auto">
                Join millions of users who trust PDFMagic for all their PDF needs. No signup required!
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full px-8 py-6 text-lg font-semibold bg-white text-violet-600 hover:bg-white/90"
                onClick={() => document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" })}
              >
                Start Now - It&apos;s Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
