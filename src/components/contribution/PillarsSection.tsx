'use client';

import { useTranslations } from "next-intl";

import { PILLAR_METADATA } from "@/app/donate/constants";
import type { PillarsSectionContent } from "@/app/donate/types";

const ContributionPillarsSection = () => {
  const t = useTranslations("contribution");

  const pillarsSectionRaw = t.raw("pillarsSection");
  const pillarsSection =
    pillarsSectionRaw && typeof pillarsSectionRaw === "object"
      ? (pillarsSectionRaw as PillarsSectionContent)
      : null;

  if (!pillarsSection || pillarsSection.cards.length === 0) {
    return null;
  }

  const { heading, steps, cards } = pillarsSection;

  return (
    <section className="bg-muted/50 rounded-2xl p-12 md:p-14 mb-28 md:mb-36">
      <div className="max-w-6xl mx-auto space-y-12 md:space-y-14">
        <h3 className="text-2xl md:text-3xl font-bold text-center md:whitespace-nowrap">{heading}</h3>

        <div className="relative">
          <div className="absolute left-0 right-0 top-[7px] h-[2px] bg-gray-200" />
          <ol className="relative z-10 grid grid-cols-3 gap-4">
            {steps.map((step) => {
              const meta = PILLAR_METADATA[step.key] ?? PILLAR_METADATA.secure;
              return (
                <li key={step.key} className="flex flex-col items-center text-center">
                  <span className={`w-3.5 h-3.5 rounded-full ring-4 ring-white ${meta.stepColor}`} />
                  <span className="mt-2 text-sm font-medium">{step.label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {cards.map((card) => {
            const meta = PILLAR_METADATA[card.key] ?? PILLAR_METADATA.secure;
            const Icon = meta.icon;
            const titleClassName = meta.titleClassName ? `font-semibold ${meta.titleClassName}` : "font-semibold";
            return (
              <div key={card.key} className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className={meta.iconWrapperClass}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className={titleClassName}>{card.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{card.subtitle}</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {card.bullets.map((bullet, bulletIdx) => (
                    <li key={`${card.key}-bullet-${bulletIdx}`}>{bullet}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ContributionPillarsSection;
