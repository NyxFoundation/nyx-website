import Link from "next/link";
import { ExternalLink, ArrowRight } from "lucide-react";
import { NotionPage } from "@/lib/notion";
import { getLocale } from "next-intl/server";

interface NewsTableProps {
    newsItems: NotionPage[];
}

export async function NewsTable({ newsItems }: NewsTableProps) {
    const locale = await getLocale();
    const isJa = locale === "ja";

    return (
        <div className="w-full border border-border rounded-lg overflow-hidden bg-background">
            <div className="max-h-[320px] overflow-y-auto">
                {newsItems.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                        {isJa ? "ニュースはありません。" : "No news available."}
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <tbody className="divide-y divide-border">
                            {newsItems.map((item) => {
                                const isExternal = !!item.redirectTo;
                                const href = item.redirectTo || `/news/${item.slug}`;
                                const title = isJa ? item.title : item.titleEn;
                                const date = item.date
                                    ? new Date(item.date).toLocaleDateString(locale, {
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit",
                                    })
                                    : "";

                                return (
                                    <tr key={item.id} className="hover:bg-muted/50 transition-colors group">
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground w-32">
                                            {date}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isExternal ? (
                                                <a
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 group-hover:text-primary transition-colors"
                                                >
                                                    {title}
                                                    <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                                </a>
                                            ) : (
                                                <Link
                                                    href={href}
                                                    prefetch={true}
                                                    className="flex items-center gap-2 group-hover:text-primary transition-colors"
                                                >
                                                    {title}
                                                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
