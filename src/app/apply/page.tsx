import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApplyForm } from "./ApplyForm";

export const metadata: Metadata = {
  title: "Apply | Nyx Foundation",
  description: "Apply for a position at Nyx Foundation",
  openGraph: {
    title: "Apply | Nyx Foundation",
    description: "Apply for a position at Nyx Foundation",
    images: ["/ogp.png"],
  },
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ position?: string }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("apply");
  const { position } = await searchParams;

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-2xl">
        <Link
          href="/recruit"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToRecruit")}
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t("description")}
        </p>

        <ApplyForm locale={locale} defaultPosition={position ?? ""} />
      </div>
    </div>
  );
}
