'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { TEAM_MEMBERS } from "@/app/contribution/constants";
import type { TeamMember, TeamSectionContent } from "@/app/contribution/types";

type NewsLinkMap = Record<string, { href: string; external: boolean }>;

const ContributionTeamSection = () => {
  const t = useTranslations("contribution");
  const tCommon = useTranslations("common");

  const teamSectionRaw = t.raw("teamSection");
  const teamSectionContent =
    teamSectionRaw && typeof teamSectionRaw === "object"
      ? (teamSectionRaw as TeamSectionContent)
      : null;

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newsMap, setNewsMap] = useState<NewsLinkMap>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/test-notion")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data?.news) return;
        const countsJa: Record<string, number> = {};
        const countsEn: Record<string, number> = {};
        for (const item of data.news) {
          countsJa[item.title] = (countsJa[item.title] || 0) + 1;
          countsEn[item.titleEn] = (countsEn[item.titleEn] || 0) + 1;
        }
        const map: NewsLinkMap = {};
        for (const item of data.news) {
          const href = item.redirectTo || `/news/${item.slug}`;
          if (countsJa[item.title] === 1) map[item.title] = { href, external: Boolean(item.redirectTo) };
          if (countsEn[item.titleEn] === 1) map[item.titleEn] = { href, external: Boolean(item.redirectTo) };
        }
        setNewsMap(map);
      })
      .catch(() => void 0);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!teamSectionContent) {
    return null;
  }

  const { heading, teamHeading, updatesHeading, viewAll, profileFallback, updates } = teamSectionContent;

  return (
    <>
      <section className="bg-muted/50 rounded-2xl p-12 md:p-14 mb-28 md:mb-36">
        <div className="max-w-6xl mx-auto space-y-12 md:space-y-14">
          <h3 className="text-2xl md:text-3xl font-bold text-center md:whitespace-nowrap">{heading}</h3>
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
              <h4 className="font-semibold mb-3">{teamHeading}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {TEAM_MEMBERS.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="relative w-20 h-20">
                      {member.avatar ? (
                        <Image
                          src={member.avatar}
                          alt={member.name}
                          fill
                          sizes="80px"
                          className="object-cover rounded-full ring-1 ring-gray-200"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-muted ring-1 ring-gray-200" />
                      )}
                    </div>
                    <span className="text-sm font-medium group-hover:underline">{member.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
              <h4 className="font-semibold mb-3">{updatesHeading}</h4>
              <div className="space-y-2">
                {updates.slice(0, 5).map((title, index) => {
                  const mapped = newsMap[title];
                  const href = mapped?.href || "/news";
                  const isExternal = mapped?.external;
                  return (
                    <div key={`${title}-${index}`} className="py-2 border-b last:border-b-0">
                      {isExternal ? (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                          {title}
                        </a>
                      ) : (
                        <Link href={href} className="text-sm font-medium hover:underline">
                          {title}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4">
                <Link href="/news" className="inline-flex items-center h-10 px-4 border border-border rounded-md hover:bg-muted/50">
                  {viewAll}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg ring-1 ring-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  {selectedMember.avatar ? (
                    <Image
                      src={selectedMember.avatar}
                      alt={selectedMember.name}
                      fill
                      sizes="40px"
                      className="object-cover rounded-full ring-1 ring-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted ring-1 ring-gray-200" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">{selectedMember.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedMember.role}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {tCommon("close")}
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm leading-relaxed text-foreground/80">{selectedMember.bio || profileFallback}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContributionTeamSection;
