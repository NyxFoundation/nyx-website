import { Metadata } from "next";
import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { PublicationsListSkeleton } from "@/components/ui/Skeleton";
import { PublicationsList } from "./PublicationsList";

export const metadata: Metadata = {
  title: "Publications | Nyx Foundation",
  description: "Research papers and publications from Nyx Foundation",
  openGraph: {
    title: "Publications | Nyx Foundation",
    description: "Research papers and publications from Nyx Foundation",
    images: ["/ogp.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Publications | Nyx Foundation",
    description: "Research papers and publications from Nyx Foundation",
    images: ["/ogp.png"],
  },
};

export default async function PublicationsPage() {
  const locale = await getLocale();
  const isJa = locale === "ja";

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Publications</h1>
        <p className="text-xl text-muted-foreground mb-12">
          {isJa
            ? "Nyx Foundationの研究成果と出版物"
            : "Research papers and publications from Nyx Foundation"}
        </p>

        <Suspense fallback={<PublicationsListSkeleton />}>
          <PublicationsList locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
