"use client";

import { Sparkles } from "lucide-react";

import type { SponsorInfo } from "@/app/donate/types";
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
  availabilityLabel?: string;
  isActive?: boolean;
};

const tierStyles: Record<SupportTierVariant, {
  container: string;
  hover: string;
  focusRing: string;
  amountText: string;
  benefitText: string;
  icon: string;
  avatarRing: string;
  extraBadge: string;
  availabilityBadge: string;
  activeRing: string;
}> = {
  premium: {
    container:
      "border border-rose-500 bg-gradient-to-br from-rose-600 via-rose-500 to-amber-400 text-white shadow-[0_12px_45px_rgba(225,29,72,0.35)]",
    hover: "hover:-translate-y-0.5 hover:shadow-[0_18px_55px_rgba(225,29,72,0.45)]",
    focusRing: "focus-visible:outline-rose-200",
    amountText: "text-white drop-shadow-[0_6px_18px_rgba(225,29,72,0.55)]",
    benefitText: "text-white/90",
    icon: "text-white/90",
    avatarRing: "ring-2 ring-rose-200/80 shadow-md",
    extraBadge: "border border-rose-200/80 bg-white text-rose-700 ring-2 ring-rose-200/60 shadow-md",
    availabilityBadge: "bg-white text-rose-700",
    activeRing: "ring-4 ring-white/70",
  },
  sponsor: {
    container:
      "border border-sky-500 bg-gradient-to-br from-sky-600 via-blue-500 to-indigo-500 text-white shadow-[0_12px_45px_rgba(56,189,248,0.28)]",
    hover: "hover:-translate-y-0.5 hover:shadow-[0_18px_55px_rgba(14,116,144,0.45)]",
    focusRing: "focus-visible:outline-sky-200",
    amountText: "text-white drop-shadow-[0_6px_18px_rgba(15,118,204,0.55)]",
    benefitText: "text-white/90",
    icon: "text-white/90",
    avatarRing: "ring-2 ring-sky-200/90 shadow-md",
    extraBadge: "border border-sky-200/80 bg-white text-sky-700 ring-2 ring-sky-200/70 shadow-md",
    availabilityBadge: "bg-white text-sky-700",
    activeRing: "ring-4 ring-white/60",
  },
  supporter: {
    container:
      "border border-emerald-300 bg-gradient-to-br from-emerald-300 via-emerald-400 to-lime-200 text-emerald-900 shadow-lg",
    hover: "hover:-translate-y-0.5 hover:shadow-[0_16px_46px_rgba(34,197,94,0.35)]",
    focusRing: "focus-visible:outline-emerald-700/60",
    amountText: "text-emerald-900 drop-shadow-[0_4px_14px_rgba(22,163,74,0.35)]",
    benefitText: "text-emerald-900/90",
    icon: "text-emerald-800",
    avatarRing: "ring-2 ring-emerald-300/80 shadow-md",
    extraBadge: "border border-emerald-300/80 bg-white text-emerald-800 ring-2 ring-emerald-300/70 shadow-md",
    availabilityBadge: "bg-white text-emerald-800",
    activeRing: "ring-4 ring-white/70",
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
  availabilityLabel,
  isActive = false,
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
      aria-pressed={isActive}
      className={cn(
        "group relative flex h-full w-full flex-col overflow-visible rounded-xl border p-5 text-left transition-transform transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        style.container,
        style.hover,
        style.focusRing,
        isActive
          ? cn(style.activeRing, "scale-[1.02] ring-offset-4 ring-offset-background brightness-105 saturate-110")
          : "ring-0 opacity-85 hover:opacity-100",
      )}
    >
      <div className="flex w-full flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold leading-tight md:text-lg">{heading}</h3>
          {availabilityLabel && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                style.availabilityBadge,
              )}
            >
              {availabilityLabel}
            </span>
          )}
        </div>
        <div className="flex items-end gap-2">
          <span
            className={cn(
              "text-3xl font-extrabold leading-none tracking-tight md:text-4xl",
              style.amountText,
            )}
          >
            {badgeLabel}
          </span>
        </div>
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
