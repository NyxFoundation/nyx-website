"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ActivityModal } from "./ActivityModal";
import {
  Search,
  Shield,
  CheckCircle,
  GraduationCap,
  Home
} from "lucide-react";

type ActivityItem = {
  id: string;
  icon: React.ReactNode;
  gridClass: string;
};

const activities: ActivityItem[] = [
  {
    id: "research",
    icon: <Search className="w-8 h-8" />,
    gridClass: "md:col-span-2 md:row-span-2",
  },
  {
    id: "whitehat",
    icon: <Shield className="w-8 h-8" />,
    gridClass: "md:col-span-1 md:row-span-1",
  },
  {
    id: "verification",
    icon: <CheckCircle className="w-8 h-8" />,
    gridClass: "md:col-span-1 md:row-span-2",
  },
  {
    id: "education",
    icon: <GraduationCap className="w-8 h-8" />,
    gridClass: "md:col-span-1 md:row-span-1",
  },
  {
    id: "house",
    icon: <Home className="w-8 h-8" />,
    gridClass: "md:col-span-1 md:row-span-1",
  },
];

export function ActivityGrid() {
  const t = useTranslations("activity");
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  return (
    <section className="py-20">
      <div className="w-full max-w-6xl mx-auto px-8 md:px-12 lg:px-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          {t("title")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:auto-rows-[minmax(150px,auto)]">
          {activities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => setSelectedActivity(activity.id)}
              className={cn(
                "group relative overflow-hidden",
                "bg-white border-2 border-border rounded-lg",
                "p-6 text-left transition-all duration-300",
                "hover:shadow-lg hover:-translate-y-1",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                activity.gridClass
              )}
            >
              <div className="flex flex-col h-full justify-between">
                <div className="mb-4">{activity.icon}</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {t(`items.${activity.id}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {t(`items.${activity.id}.description`)}
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