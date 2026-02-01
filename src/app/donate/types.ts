import type { LucideIcon } from "lucide-react";

export type PaymentMethod = "ETH" | "USDC" | "USDT" | "DAI" | "JPY";

export type CryptoChain = "ethereum" | "optimism" | "arbitrum" | "base";

export type TokenPaymentMethod = Exclude<PaymentMethod, "ETH" | "JPY">;

export type StorySectionContent = {
  heading: string;
  imageAlt: string;
  body: string[];
};

export type StoryLayout = {
  imageSrc: string;
  imageSizes: string;
  textContainerClass: string;
  imageContainerClass: string;
  wrapperSpacingClass: string;
};

export type TeamSectionContent = {
  heading: string;
  teamHeading: string;
  updatesHeading: string;
  viewAll: string;
  profileFallback: string;
  updates: string[];
};

export type FaqItemRaw = {
  question: string;
  answer?: string;
  answerKey?: string;
};

export type SponsorInfo = {
  names: Record<string, string> & { default: string };
  logo: string | null;
};

export type PillarStep = {
  key: string;
  label: string;
};

export type PillarCard = {
  key: string;
  title: string;
  subtitle: string;
  bullets: string[];
};

export type PillarsSectionContent = {
  heading: string;
  steps: PillarStep[];
  cards: PillarCard[];
};

export type PillarMetadata = {
  icon: LucideIcon;
  stepColor: string;
  iconWrapperClass: string;
  titleClassName?: string;
};
