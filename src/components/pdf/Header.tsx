"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Menu, X, Moon, Sun, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const pathname = usePathname();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  // Check if we're on the homepage
  const isHomepage = pathname === "/";

  // Helper to create proper navigation links
  const getNavHref = (anchor: string) => {
    if (isHomepage) {
      return `#${anchor}`;
    }
    return `/#${anchor}`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 group-hover:shadow-lg group-hover:shadow-violet-500/30 transition-all duration-300">
              <FileText className="w-6 h-6 text-white" />
              <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1" />
            </div>
            <span className="text-xl font-bold gradient-text">PDFMagic</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href={getNavHref("tools")} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              All Tools
            </Link>
            <Link 
              href={getNavHref("features")} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link 
              href={getNavHref("pricing")} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Pricing
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            <Link href="/">
              <Button className="hidden md:flex btn-gradient text-white rounded-full px-6">
                Get Started
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            isMenuOpen ? "max-h-64 pb-4" : "max-h-0"
          )}
        >
          <nav className="flex flex-col gap-2 pt-4">
            <Link 
              href={getNavHref("tools")} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              All Tools
            </Link>
            <Link 
              href={getNavHref("features")} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href={getNavHref("pricing")} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link href="/" onClick={() => setIsMenuOpen(false)}>
              <Button className="btn-gradient text-white rounded-full mt-2 w-full">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
