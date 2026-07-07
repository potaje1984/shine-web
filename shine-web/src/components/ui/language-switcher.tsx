"use client";

import { useTranslation, type Locale } from "@/lib/i18n";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  function toggle() {
    const next: Locale = locale === "en" ? "es" : "en";
    setLocale(next);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={className}
    >
      <Languages className="h-4 w-4 mr-1.5" />
      <span className="text-xs font-medium uppercase">{locale === "en" ? "ES" : "EN"}</span>
    </Button>
  );
}