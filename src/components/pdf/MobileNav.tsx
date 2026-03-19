"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Search, Folder, History, User, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";

interface MobileNavProps {
  className?: string;
}

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/#tools", icon: Search, label: "Tools" },
  { href: "/dashboard", icon: Folder, label: "Files" },
  { href: "/dashboard", icon: History, label: "History" },
];

export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide/show nav based on scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Don't show on tool pages or auth pages
  if (pathname.startsWith("/tool/") || pathname.startsWith("/auth/")) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-pb",
            className
          )}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-border/50" />
          
          {/* Navigation content */}
          <div className="relative flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href.includes("#") && pathname === "/");
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 w-16 h-full min-h-[48px] transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative"
                  >
                    <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-indicator"
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                      />
                    )}
                  </motion.div>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}

            {/* Quick action button */}
            <Link
              href="/#tools"
              className="flex flex-col items-center justify-center gap-1 w-16 h-full min-h-[48px]"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30"
              >
                <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
              </motion.div>
              <span className="text-xs font-medium text-muted-foreground">New</span>
            </Link>

            {/* Profile / Sign in */}
            <Link
              href={isAuthenticated ? "/dashboard" : "/auth/login"}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 h-full min-h-[48px] transition-colors",
                isAuthenticated
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isAuthenticated ? (
                <>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {user?.user_metadata?.name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <span className="text-xs font-medium">Profile</span>
                </>
              ) : (
                <>
                  <User className="w-6 h-6" strokeWidth={2} />
                  <span className="text-xs font-medium">Sign In</span>
                </>
              )}
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
