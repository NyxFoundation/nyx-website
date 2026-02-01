import activitiesData from "@/data/activities.json";

export type LocaleKey = "en" | "ja";

export type ActivityText = {
  id: string;
  title: Record<LocaleKey, string>;
  description: Record<LocaleKey, string>;
};

export type ActivityDetailItem = {
  image: string; // path under public/
  title: Record<LocaleKey, string>;
  description: Record<LocaleKey, string>;
  link?: string; // optional external link
};

type ActivitiesData = {
  texts: ActivityText[];
  details: Record<string, ActivityDetailItem[]>;
};

const typedActivitiesData = activitiesData as ActivitiesData;

export const activitiesText: ActivityText[] = typedActivitiesData.texts;

export function getActivityText(id: string, locale: LocaleKey) {
  const item = activitiesText.find((a) => a.id === id);
  if (!item) return { title: "", description: "" };
  return {
    title: item.title[locale],
    description: item.description[locale],
  };
}

// Optional per-activity rich details to show in the modal
export const activitiesDetails: Record<string, ActivityDetailItem[]> = typedActivitiesData.details;

export function getActivityDetails(id: string, locale: LocaleKey) {
  const items = activitiesDetails[id] || [];
  return items.map((it) => ({
    image: it.image,
    title: it.title[locale],
    description: it.description[locale],
    link: it.link,
  }));
}
