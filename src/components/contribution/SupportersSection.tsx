'use client';

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { HelpCircle } from "lucide-react";

import { CORPORATE_SPONSORS, INDIVIDUAL_SUPPORTERS } from "@/app/donate/constants";
import type { SponsorInfo } from "@/app/donate/types";

const getLocalizedName = (entry: SponsorInfo, locale: string) => entry.names[locale] ?? entry.names.default;

const ContributionSupportersSection = () => {
  const locale = useLocale();
  const t = useTranslations("contribution");

  const supportersHeading = t("supportersSection.heading");
  const sponsorTitle = t("supportersSection.sponsorTitle");
  const supporterTitle = t("supportersSection.supporterTitle");

  return (
    <section className="mb-28 md:mb-36">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-xl md:text-3xl font-bold md:whitespace-nowrap">{supportersHeading}</h2>
        </div>
        <div className="rounded-xl px-6 py-12 md:px-14 md:py-14 bg-white shadow-sm ring-1 ring-gray-100">
          <div className="grid grid-cols-1 gap-12 md:gap-14">
            <div>
              <h3 className="text-xl md:text-2xl font-bold leading-tight mb-8">{sponsorTitle}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
                {CORPORATE_SPONSORS.map((sponsor) => (
                  <div key={sponsor.names.default} className="flex flex-col items-center gap-3">
                    <div className="relative w-16 h-16">
                      {sponsor.logo ? (
                        <Image
                          src={sponsor.logo}
                          alt={sponsor.names.default}
                          fill
                          className="object-cover rounded-full ring-1 ring-gray-200"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted rounded-full ring-1 ring-gray-200" />
                      )}
                    </div>
                    <div className="text-xs md:text-sm text-center text-foreground/80">
                      {getLocalizedName(sponsor, locale)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold leading-tight mb-8">{supporterTitle}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
                {INDIVIDUAL_SUPPORTERS.map((supporter) => (
                  <div key={supporter.names.default} className="flex flex-col items-center gap-3">
                    <div className="relative w-16 h-16">
                      {supporter.logo ? (
                        <Image
                          src={supporter.logo}
                          alt={supporter.names.default}
                          fill
                          className="object-cover rounded-full ring-1 ring-gray-200"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted rounded-full ring-1 ring-gray-200 flex items-center justify-center">
                          <HelpCircle className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs md:text-sm text-center text-foreground/80">
                      {getLocalizedName(supporter, locale)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContributionSupportersSection;
