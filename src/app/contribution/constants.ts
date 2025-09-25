import {
  Lightbulb,
  ShieldCheck,
  FunctionSquare,
} from "lucide-react";

import type {
  CryptoChain,
  PaymentMethod,
  PillarMetadata,
  SponsorInfo,
  StoryLayout,
  TeamMember,
  TokenPaymentMethod,
} from "./types";

export const DONATION_ADDRESS = "0xa1a8d76a0044ce9d8aef7c5279111a3029f58a6a";

export const CHAIN_ID_MAP: Record<CryptoChain, number> = {
  ethereum: 1,
  optimism: 10,
  arbitrum: 42161,
  base: 8453,
};

export const WALLETCONNECT_METADATA = {
  name: "Nyx Foundation",
  description: "Nyx Foundation donations",
  url: "https://nyx.foundation",
  icons: ["https://nyx.foundation/icon.png"],
};

export const WALLETCONNECT_RELAY_URL = "wss://relay.walletconnect.com";

export const WALLETCONNECT_METHODS = ["eth_sendTransaction"] as const;

export const WALLETCONNECT_EVENTS = ["accountsChanged", "chainChanged"] as const;

export const DEFAULT_GAS_HEX = "0x5208";

export const TOKEN_TRANSFER_GAS_HEX = "0x186a0";

export const ERC20_METADATA: Record<
  TokenPaymentMethod,
  { decimals: number; contracts: Partial<Record<CryptoChain, `0x${string}`>> }
> = {
  USDC: {
    decimals: 6,
    contracts: {
      ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      optimism: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
      arbitrum: "0xAf88d065e77c8cC2239327C5EDb3A432268e5831",
      base: "0x833589fCD6eDb6E08f4c7c32D4f71b54bDa02913",
    },
  },
  USDT: {
    decimals: 6,
    contracts: {
      ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      optimism: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      arbitrum: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    },
  },
  DAI: {
    decimals: 18,
    contracts: {
      ethereum: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      optimism: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      arbitrum: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    },
  },
};

export const STORY_LAYOUTS: StoryLayout[] = [
  {
    imageSrc: "/ethereum-community.png",
    imageSizes: "(max-width: 768px) 100vw, (max-width: 1024px) 320px, 400px",
    textContainerClass:
      "order-2 md:order-2 lg:col-span-7 self-center space-y-4 text-[15px] md:text-base text-muted-foreground leading-relaxed",
    imageContainerClass: "order-1 md:order-1 lg:col-span-5",
    wrapperSpacingClass: "space-y-12 md:space-y-14",
  },
  {
    imageSrc: "/gallery/activities-hero.jpg",
    imageSizes: "(max-width: 768px) 100vw, (max-width: 1024px) 320px, 400px",
    textContainerClass:
      "order-1 md:order-1 lg:col-span-7 self-center space-y-4 text-[15px] md:text-base text-muted-foreground leading-relaxed",
    imageContainerClass: "order-2 md:order-2 lg:col-span-5",
    wrapperSpacingClass: "space-y-8 md:space-y-10",
  },
];

export const PILLAR_METADATA: Record<string, PillarMetadata> = {
  secure: {
    icon: ShieldCheck,
    stepColor: "bg-emerald-500",
    iconWrapperClass: "p-2 rounded-md bg-emerald-50 text-emerald-700",
  },
  usable: {
    icon: FunctionSquare,
    stepColor: "bg-amber-500",
    iconWrapperClass: "p-2 rounded-md bg-amber-50 text-amber-700",
  },
  expand: {
    icon: Lightbulb,
    stepColor: "bg-sky-500",
    iconWrapperClass: "p-2 rounded-md bg-sky-50 text-sky-700",
    titleClassName: "md:whitespace-nowrap",
  },
};

export const FIXED_AMOUNTS: Record<PaymentMethod, readonly number[]> = {
  ETH: [0.15, 1.5, 7.5],
  USDC: [600, 6_000, 30_000],
  USDT: [600, 6_000, 30_000],
  DAI: [600, 6_000, 30_000],
  JPY: [93_000, 930_000, 4_500_000],
};

export const SUPPORT_TIER_ETH_AMOUNTS = {
  supporter: 0.15,
  sponsor: 1.5,
  premium: 7.5,
} as const;

export const TIER_AMOUNT_BADGES = {
  supporter: "0.15 ETH+",
  sponsor: "1.5 ETH+",
  premium: "7.5 ETH+",
} as const;

export const ETH_TO_USD = 4500;

export const USD_TO_JPY = 145;

export const ETH_TO_JPY = ETH_TO_USD * USD_TO_JPY;

export const NUMBER_LOCALE_MAP: Record<string, string> = {
  ja: "en-US",
};

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "vita", name: "vita", role: "Consensus / MEV", avatar: "/residents/vita.jpeg", bio: "Consensus and MEV research, protocol direction." },
  { id: "gohan", name: "gohan", role: "zkVM / Whitehat", avatar: "/residents/gohan.jpg", bio: "zkVM research and whitehat security contributions." },
  { id: "banri", name: "banri", role: "Formal Verification", avatar: "/residents/banri.jpeg", bio: "Specs, proofs, and verification tooling." },
  { id: "adust", name: "adust", role: "VOLE / MPC", avatar: "/residents/adust.jpg", bio: "MPC and VOLE implementations." },
  { id: "tomo", name: "tomo", role: "CrossChain / Interoperability", avatar: "/residents/tomo.jpg", bio: "CrossChain protocols and interoperability research." },
  { id: "alpha", name: "Alphaist", role: "MEV / DeFi", avatar: "/residents/alpha.jpeg", bio: "MEV, DeFi, and market microstructure." },
  { id: "hiro", name: "Hiro", role: "MEV / PBS", avatar: "/residents/tei.jpeg", bio: "MEV, PBS, and mechanism design." },
];

export const CORPORATE_SPONSORS: SponsorInfo[] = [
  {
    names: { default: "Ethereum Foundation", ja: "イーサリアム財団" },
    logo: "/sponsors/ef.jpg",
  },
  {
    names: { default: "Geodework", ja: "ジオデワーク" },
    logo: "/sponsors/geodework.jpg",
  },
  {
    names: { default: "GuildQB", ja: "ギルドQB" },
    logo: "/sponsors/guildqb.png",
  },
  {
    names: { default: "KIRIFUDA Inc.", ja: "キリフダ株式会社" },
    logo: "/sponsors/kirifuda.jpg",
  },
  {
    names: { default: "Hiro Shimo", ja: "志茂 博" },
    logo: "/sponsors/shimo.jpg",
  },
  {
    names: { default: "chikeo", ja: "ちけみーくん" },
    logo: "/sponsors/ticket.jpg",
  },
  {
    names: { default: "KIMINORI JAPAN", ja: "キミノリ・ジャパン" },
    logo: "/sponsors/kiminorijapan.jpg",
  },
  {
    names: { default: "Anonymous", ja: "匿名希望" },
    logo: null,
  },
];

export const PREMIUM_SPONSORS: SponsorInfo[] = [];

export const INDIVIDUAL_SUPPORTERS: SponsorInfo[] = [
  {
    names: { default: "DeSci Tokyo", ja: "デサイ東京" },
    logo: "/sponsors/desci.jpg",
  },
];
