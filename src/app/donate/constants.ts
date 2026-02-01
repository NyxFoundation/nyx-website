import { Lightbulb, ShieldCheck, FunctionSquare } from "lucide-react";
import donateData from "@/data/donate.json";

import type {
  CryptoChain,
  PaymentMethod,
  PillarMetadata,
  SponsorInfo,
  StoryLayout,
  TokenPaymentMethod,
} from "./types";

type IconKey = "ShieldCheck" | "FunctionSquare" | "Lightbulb";

type DonateData = {
  donationAddress: string;
  chainIdMap: Record<CryptoChain, number>;
  walletconnectMetadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  walletconnectRelayUrl: string;
  walletconnectMethods: string[];
  walletconnectEvents: string[];
  defaultGasHex: string;
  tokenTransferGasHex: string;
  erc20Metadata: Record<
    TokenPaymentMethod,
    { decimals: number; contracts: Partial<Record<CryptoChain, `0x${string}`>> }
  >;
  storyLayouts: StoryLayout[];
  pillarMetadata: Record<
    string,
    {
      icon: IconKey;
      stepColor: string;
      iconWrapperClass: string;
      titleClassName?: string;
    }
  >;
  fixedAmounts: Record<PaymentMethod, readonly number[]>;
  numberLocaleMap: Record<string, string>;
  sponsors: {
    corporate: SponsorInfo[];
    premium: SponsorInfo[];
    individual: SponsorInfo[];
  };
};

const typedDonateData = donateData as DonateData;

export const DONATION_ADDRESS = typedDonateData.donationAddress;

export const CHAIN_ID_MAP: Record<CryptoChain, number> = typedDonateData.chainIdMap;

export const WALLETCONNECT_METADATA = typedDonateData.walletconnectMetadata;

export const WALLETCONNECT_RELAY_URL = typedDonateData.walletconnectRelayUrl;

export const WALLETCONNECT_METHODS = typedDonateData.walletconnectMethods as readonly string[];

export const WALLETCONNECT_EVENTS = typedDonateData.walletconnectEvents as readonly string[];

export const DEFAULT_GAS_HEX = typedDonateData.defaultGasHex;

export const TOKEN_TRANSFER_GAS_HEX = typedDonateData.tokenTransferGasHex;

export const ERC20_METADATA: Record<
  TokenPaymentMethod,
  { decimals: number; contracts: Partial<Record<CryptoChain, `0x${string}`>> }
> = typedDonateData.erc20Metadata;

export const STORY_LAYOUTS: StoryLayout[] = typedDonateData.storyLayouts;

const iconMap = {
  ShieldCheck,
  FunctionSquare,
  Lightbulb,
} satisfies Record<IconKey, PillarMetadata["icon"]>;

export const PILLAR_METADATA = Object.fromEntries(
  Object.entries(typedDonateData.pillarMetadata).map(([key, value]) => [
    key,
    {
      ...value,
      icon: iconMap[value.icon],
    },
  ])
) as Record<string, PillarMetadata>;

export const FIXED_AMOUNTS: Record<PaymentMethod, readonly number[]> = typedDonateData.fixedAmounts;

export const SUPPORT_TIER_ETH_AMOUNTS = {
  supporter: FIXED_AMOUNTS.ETH[0],
  sponsor: FIXED_AMOUNTS.ETH[1],
  premium: FIXED_AMOUNTS.ETH[2],
} as const;

export const TIER_AMOUNT_BADGES = {
  supporter: FIXED_AMOUNTS.ETH[0].toString() + " ETH+",
  sponsor: FIXED_AMOUNTS.ETH[1].toString() + " ETH+",
  premium: FIXED_AMOUNTS.ETH[2].toString() + " ETH+",
} as const;

export const NUMBER_LOCALE_MAP: Record<string, string> = typedDonateData.numberLocaleMap;

export const CORPORATE_SPONSORS: SponsorInfo[] = typedDonateData.sponsors.corporate;

export const PREMIUM_SPONSORS: SponsorInfo[] = typedDonateData.sponsors.premium;

export const INDIVIDUAL_SUPPORTERS: SponsorInfo[] = typedDonateData.sponsors.individual;
