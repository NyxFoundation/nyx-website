"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Mail, Github, Twitter } from "lucide-react";

export function Footer() {
  const t = useTranslations("nav");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ロゴと説明 */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-full bg-foreground"></div>
              <span className="text-xl font-semibold">Nyx</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Building humanity&apos;s coordination space securely for open innovation
            </p>
          </div>

          {/* ナビゲーションリンク */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-3">Research</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/publications" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("publications")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/news" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("news")}
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">About</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/member" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("member")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/funding" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("funding")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/job" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("job")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("contact")}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* コンタクト情報 */}
          <div className="md:col-span-1">
            <h3 className="font-semibold mb-3">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="mailto:contact@nyx.foundation"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/nyxfoundation"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/nyxfoundation"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Nyx Foundation. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}