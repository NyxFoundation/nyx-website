'use client';

import Image from 'next/image';

import type { SponsorInfo } from '@/app/contribution/types';
import { cn } from '@/lib/utils';

export const getLocalizedSponsorName = (entry: SponsorInfo, locale: string) =>
  entry.names[locale] ?? entry.names.default;

const getInitial = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) {
    return '?';
  }
  return trimmed.charAt(0).toUpperCase();
};

type DonorAvatarProps = {
  donor: SponsorInfo;
  locale: string;
  size?: number;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  ringClassName?: string;
};

export function DonorAvatar({
  donor,
  locale,
  size = 36,
  className,
  imageClassName,
  fallbackClassName,
  ringClassName,
}: DonorAvatarProps) {
  const displayName = getLocalizedSponsorName(donor, locale);
  const initial = getInitial(displayName);

  return (
    <div
      aria-hidden="true"
      title={displayName}
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-full bg-white text-xs font-semibold uppercase text-gray-900',
        ringClassName ?? 'ring-2 ring-white shadow-sm',
        className,
      )}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {donor.logo ? (
        <Image
          src={donor.logo}
          alt=""
          fill
          sizes={`${size}px`}
          className={cn('object-cover', imageClassName)}
        />
      ) : (
        <span className={cn('text-[11px] tracking-wide text-gray-900', fallbackClassName)}>{initial}</span>
      )}
    </div>
  );
}
