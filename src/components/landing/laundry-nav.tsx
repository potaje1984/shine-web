"use client";

import { motion } from "framer-motion";
import { Sparkles, Home } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export function LaundryNav() {
  const { t } = useTranslation();

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 px-3 py-3 sm:px-6 sm:py-4"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl glass px-3 py-2.5 sm:px-5 sm:py-3">
        <a href="#" className="flex items-center gap-2">
          <Image src="/shine-logo.png" alt="Shine" width={140} height={76} className="h-7 w-auto sm:h-9 rounded-none" />
          <span className="font-sans text-sm font-bold tracking-tight">
            Shine
          </span>
        </a>

        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          <a href="#services" className="transition-colors hover:text-foreground">
            {t("landing.nav.services")}
          </a>
          <a href="#how" className="transition-colors hover:text-foreground">
            {t("landing.nav.howItWorks")}
          </a>
          <a href="#cleaning-how" className="flex items-center gap-1.5 transition-colors hover:text-cyan-400">
            <Home className="h-3.5 w-3.5" />
            {t("landing.nav.cleaning")}
          </a>
          <a href="#payment" className="transition-colors hover:text-foreground">
            {t("landing.nav.payments")}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a
            href="/register"
            className="gradient-button !px-4 !py-2 text-xs"
          >
            {t("landing.nav.quote")}
          </a>
        </div>
      </div>
    </motion.header>
  );
}