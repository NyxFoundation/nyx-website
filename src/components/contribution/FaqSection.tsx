'use client';

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

import type { FaqItemRaw } from "@/app/donate/types";

const ContributionFaqSection = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const t = useTranslations("contribution");

  const faqItemsRaw = t.raw("faqSection.items");
  const faqItems = Array.isArray(faqItemsRaw)
    ? (faqItemsRaw as FaqItemRaw[]).map((item) => ({
        question: item.question,
        answer: item.answerKey ? t(item.answerKey) : item.answer ?? "",
      }))
    : [];

  if (faqItems.length === 0) {
    return null;
  }

  const faqHeading = t("faqSection.heading");
  const faqDescription = t("faqSection.description");
  const faqContactCta = t("faqSection.contactCta");

  return (
    <section className="mb-28 md:mb-36">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-14">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 md:whitespace-nowrap">{faqHeading}</h2>
          <p className="text-muted-foreground">{faqDescription}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
          {faqItems.map((faq, idx) => (
            <div key={`${faq.question}-${idx}`} className="rounded-md bg-white/90 shadow-sm ring-1 ring-gray-100">
              <button onClick={() => setOpenFaq((prev) => (prev === idx ? null : idx))} className="w-full p-6 text-left hover:bg-muted/40">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold pr-4 tracking-tight">{faq.question}</h3>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-10 md:mt-12">
          <p className="text-muted-foreground">{faqContactCta}</p>
        </div>
      </div>
    </section>
  );
};

export default ContributionFaqSection;
