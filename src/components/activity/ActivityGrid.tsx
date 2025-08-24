"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ActivityModal } from "./ActivityModal";

type ActivityItem = {
  id: string;
  icon: React.ReactNode;
  gridClass: string;
};

const activities: ActivityItem[] = [
  {
    id: "research",
    icon: (
      <div className="relative w-full aspect-[4/3] md:aspect-[16/9] overflow-hidden rounded-lg">
        <Image
          src="/presentation.jpg"
          alt="Research Presentation"
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover rounded-lg"
        />
      </div>
    ),
    gridClass: "md:col-span-2 md:row-span-2",
  },
  {
    id: "whitehat",
    icon: (
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg">
        <Image
          src="/code.png"
          alt="Whitehat Hacking"
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover rounded-lg"
        />
      </div>
    ),
    gridClass: "md:col-span-1 md:row-span-1",
  },
  {
    id: "house",
    icon: (
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg">
        <Image
          src="/house.png"
          alt="House"
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain rounded-lg"
        />
      </div>
    ),
    gridClass: "md:col-span-1 md:row-span-2",
  },
  {
    id: "education",
    icon: (
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg">
        <Image
          src="/education.png"
          alt="Education"
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover rounded-lg"
        />
      </div>
    ),
    gridClass: "md:col-span-1 md:row-span-1",
  },
  {
    id: "verification",
    icon: (
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg">
        <Image
          src="/math.png"
          alt="Formal Verification"
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover rounded-lg"
        />
      </div>
    ),
    gridClass: "md:col-span-1 md:row-span-1",
  },
];

import { getActivityText, type LocaleKey } from "@/content/activities";

export function ActivityGrid() {
  const locale = (useLocale() as LocaleKey) || "en";
  const t = useTranslations("activity");
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  return (
    <section className="py-10">
      <div className="w-full max-w-6xl mx-auto px-8 md:px-12 lg:px-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">{t("title")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:auto-rows-[minmax(150px,auto)]">
          {activities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => setSelectedActivity(activity.id)}
              className={cn(
                "group relative overflow-hidden",
                "bg-white border-2 border-border border-gray-400 rounded-lg",
                "p-6 text-left transition-all duration-300",
                "hover:shadow-lg hover:-translate-y-1",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                activity.gridClass
              )}
            >
              <div className="flex flex-col h-full justify-start">
                <div className="mb-4">{activity.icon}</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {getActivityText(activity.id, locale).title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {getActivityText(activity.id, locale).description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedActivity && (
        <ActivityModal
          activityId={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </section>
  );
}
