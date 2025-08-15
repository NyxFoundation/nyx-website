"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Mail, Github, Twitter } from "lucide-react";

export function Footer() {
  const t = useTranslations("nav");
  const tHero = useTranslations("hero");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ロゴと説明 */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-3">
              <span className="text-xl font-semibold">Nyx</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {tHero("subtitle")}
            </p>
          </div>

          {/* ナビゲーションリンク */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-3">{t("Research")}</h3>
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
                <h3 className="font-semibold mb-3">{t("About")}</h3>
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
            <h3 className="font-semibold mb-3">{t("Connect")}</h3>
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
          <div className="flex">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Nyx Foundation. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}