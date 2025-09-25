'use client';

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { STORY_LAYOUTS } from "@/app/donate/constants";
import type { StorySectionContent } from "@/app/donate/types";

const ContributionHeroSection = () => {
  const t = useTranslations("contribution");

  const heroHeading = t("pageHero.heading");
  const heroDescription = t.rich("pageHero.description", {
    highlight: (chunks) => <span className="font-semibold">{chunks}</span>,
  });

  const storySectionsRaw = t.raw("storySections");
  const storySections = Array.isArray(storySectionsRaw) ? (storySectionsRaw as StorySectionContent[]) : [];
  const storyContent = storySections.map((section, index) => {
    const layout = STORY_LAYOUTS[index] ?? STORY_LAYOUTS[STORY_LAYOUTS.length - 1];
    return { ...section, layout };
  });

  return (
    <>
      <section className="relative grid grid-cols-1 items-start mb-28 md:mb-36 overflow-hidden pt-24 sm:pt-28 md:pt-40">
        <div className="relative z-10 space-y-5 md:space-y-6">
          <div className="pointer-events-none select-none absolute z-0 -left-6 top-[-108px] md:top-[-140px] w-[180px] h-[180px] md:w-[260px] md:h-[260px] opacity-10">
            <div className="relative h-full w-full">
              <Image
                src="/icon.svg"
                alt=""
                aria-hidden
                fill
                sizes="(min-width: 768px) 260px, 180px"
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">{heroHeading}</h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{heroDescription}</p>
          <Link
            href="#support-nyx"
            className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-lime-300 via-emerald-400 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_0_22px_rgba(74,222,128,0.45)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(16,185,129,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
          >
            {t("supportSection.heading")}
          </Link>
        </div>
      </section>

      {storyContent.map((section, idx) => (
        <section key={`${section.heading}-${idx}`} className="bg-muted/50 rounded-2xl p-12 md:p-14 mb-28 md:mb-36">
          <div className={`max-w-6xl mx-auto ${section.layout.wrapperSpacingClass}`}>
            <h2 className="text-2xl md:text-3xl font-bold text-center md:whitespace-nowrap">{section.heading}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-7 md:gap-9 items-center">
              <div className={section.layout.textContainerClass}>
                {section.body.map((paragraph, paragraphIndex) => (
                  <p key={`${section.heading}-paragraph-${paragraphIndex}`}>{paragraph}</p>
                ))}
              </div>
              <div className={section.layout.imageContainerClass}>
                <div className="relative w-full aspect-[16/9] md:aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-sm">
                  <Image
                    src={section.layout.imageSrc}
                    alt={section.imageAlt}
                    fill
                    sizes={section.layout.imageSizes}
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  );
};

export default ContributionHeroSection;
