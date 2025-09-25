"use client";

import { Sparkles } from "lucide-react";

import type { SponsorInfo } from "@/app/contribution/types";
import { cn } from "@/lib/utils";

import { DonorAvatar, getLocalizedSponsorName } from "./DonorAvatar";

export type SupportBenefit = {
  title: string;
  description: string;
};

type SupportTierVariant = "premium" | "sponsor" | "supporter";

type SupportTierButtonProps = {
  heading: string;
  badgeLabel: string;
  benefits: SupportBenefit[];
  onClick: () => void;
  variant: SupportTierVariant;
  donors?: SponsorInfo[];
  locale: string;
  donorNames?: string;
  donorPreviewLabel?: string;
};

const tierStyles: Record<SupportTierVariant, {
  container: string;
  hover: string;
  focusRing: string;
  badge: string;
  benefitText: string;
  icon: string;
  avatarRing: string;
  extraBadge: string;
}> = {
  premium: {
    container:
      "border border-fuchsia-400/70 bg-gradient-to-br from-fuchsia-600 via-rose-500 to-amber-300 text-white shadow-[0_0_28px_rgba(244,114,182,0.35)]",
    hover: "hover:-translate-y-0.5 hover:shadow-[0_0_38px_rgba(251,191,36,0.45)]",
    focusRing: "focus-visible:outline-amber-100",
    badge: "bg-white/20 text-white",
    benefitText: "text-white/90",
    icon: "text-white/90",
    avatarRing: "ring-2 ring-fuchsia-200/80 shadow-md",
    extraBadge: "border border-fuchsia-200/80 bg-white text-fuchsia-800 ring-2 ring-fuchsia-200/60 shadow-md",
  },
  sponsor: {
    container:
      "border border-emerald-500 bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-400 text-white shadow-lg",
    hover: "hover:-translate-y-0.5 hover:shadow-xl",
    focusRing: "focus-visible:outline-white/70",
    badge: "bg-white/15 text-white",
    benefitText: "text-white/90",
    icon: "text-white/90",
    avatarRing: "ring-2 ring-emerald-200/90 shadow-md",
    extraBadge: "border border-emerald-200/80 bg-white text-emerald-800 ring-2 ring-emerald-200/70 shadow-md",
  },
  supporter: {
    container:
      "border border-emerald-300 bg-gradient-to-br from-emerald-300 via-teal-200 to-sky-200 text-emerald-900 shadow-lg",
    hover: "hover:-translate-y-0.5 hover:shadow-xl",
    focusRing: "focus-visible:outline-emerald-700/60",
    badge: "bg-emerald-900/10 text-emerald-900",
    benefitText: "text-emerald-900/90",
    icon: "text-emerald-800",
    avatarRing: "ring-2 ring-emerald-300/80 shadow-md",
    extraBadge: "border border-emerald-300/80 bg-white text-emerald-800 ring-2 ring-emerald-300/70 shadow-md",
  },
};

const MAX_DONOR_PREVIEW = 10;

export function SupportTierButton({
  heading,
  badgeLabel,
  benefits,
  onClick,
  variant,
  donors = [],
  locale,
  donorNames,
  donorPreviewLabel,
}: SupportTierButtonProps) {
  const style = tierStyles[variant];
  const previewDonors = donors.slice(0, MAX_DONOR_PREVIEW);
  const extraCount = donors.length - previewDonors.length;
  const hasDonors = previewDonors.length > 0;
  const previewTitle = donorNames ?? previewDonors.map((entry) => getLocalizedSponsorName(entry, locale)).join(", ");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex h-full w-full flex-col overflow-visible rounded-xl border p-5 text-left transition-transform duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        style.container,
        style.hover,
        style.focusRing,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-tight">{heading}</h3>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
            style.badge,
          )}
        >
          {badgeLabel}
        </span>
      </div>
      <ul className="mt-4 space-y-3">
        {benefits.map((benefit) => (
          <li key={`${variant}-${benefit.title}`} className="flex items-start gap-3">
            <Sparkles className={cn("h-5 w-5 shrink-0", style.icon)} />
            <span className={cn("text-sm leading-relaxed", style.benefitText)}>{benefit.description}</span>
          </li>
        ))}
      </ul>
      {hasDonors && (
        <div className="pointer-events-none absolute -bottom-5 right-0 z-10 flex -space-x-3" title={previewTitle}>
          {previewDonors.map((donor, index) => (
            <DonorAvatar
              key={`${variant}-${donor.names.default}-${index}`}
              donor={donor}
              locale={locale}
              ringClassName={style.avatarRing}
            />
          ))}
          {extraCount > 0 && (
            <div
              aria-hidden="true"
              className={cn(
                "flex h-9 w-9 min-w-[36px] min-h-[36px] items-center justify-center rounded-full text-xs font-semibold",
                style.extraBadge,
              )}
            >
              +{extraCount}
            </div>
          )}
        </div>
      )}
      {hasDonors && donorPreviewLabel && <span className="sr-only">{donorPreviewLabel}</span>}
    </button>
  );
}
