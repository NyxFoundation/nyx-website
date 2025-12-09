"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "./LanguageToggle";

export function Header() {
  const t = useTranslations("nav");
  const [isOpen, setIsOpen] = useState(false);

  type NavItem = { href: string; label: string; external?: boolean };

  const navItems: NavItem[] = [
    { href: "/projects", label: t("projects") },
    { href: "/publications", label: t("publications") },
    { href: "/member", label: t("member") },
    { href: "/donate", label: t("contribution") },
  ];

  // モバイルメニューが開いているときはスクロールを防ぐ
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // ウィンドウサイズが変わったときにメニューを閉じる
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border border-gray-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo - 左側 */}
            <Link href="/" className="flex items-center">
              <Image
                src="/icon.svg"
                alt="Nyx Foundation"
                width={32}
                height={32}
                className="w-7 h-7 md:w-8 md:h-8"
              />
            </Link>

            {/* Desktop Navigation - 中央 */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) =>
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium transition-colors hover:text-muted-foreground"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium transition-colors hover:text-muted-foreground"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {/* Language Toggle - 右端 */}
            <div className="hidden md:block">
              <LanguageToggle />
            </div>

            {/* Mobile Menu Button - モバイルのみ表示 */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 block md:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <>
        {/* Overlay - モバイルのみ、開いているときのみ表示 */}
        <div
          className={cn(
            "fixed inset-0 bg-black/50 z-40 block md:hidden",
            isOpen ? "block" : "hidden"
          )}
          onClick={() => setIsOpen(false)}
        />

        {/* Sidebar - モバイルのみ表示 */}
        <aside
          className={cn(
            "fixed top-0 right-0 h-full w-64 z-50 bg-white",
            "transition-transform duration-300 ease-in-out",
            "border-l border-border shadow-lg",
            "block md:hidden" // デスクトップでは完全に非表示
          )}
          style={{
            transform: isOpen ? "translateX(0)" : "translateX(100%)",
          }}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="text-lg font-semibold"></span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="text-base font-medium py-2 px-3 rounded-md transition-colors hover:bg-muted"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="text-base font-medium py-2 px-3 rounded-md transition-colors hover:bg-muted"
                >
                  {item.label}
                </Link>
              )
            )}
            <div className="pt-4 mt-4 border-t border-border">
              <LanguageToggle />
            </div>
          </nav>
        </aside>
      </>
    </>
  );
}
