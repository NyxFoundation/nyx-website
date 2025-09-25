"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  Heart,
  Users,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Copy,
  ShieldCheck,
  FunctionSquare,
  BadgeCheck,
  HelpCircle,
  RefreshCcw,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SupportTierButton, type SupportBenefit } from "@/components/contribution/SupportTierButton";
import QRCode from "react-qr-code";
import SignClient from "@walletconnect/sign-client";
import type { SignClientTypes, SessionTypes } from "@walletconnect/types";

type PaymentMethod = "ETH" | "USDC" | "USDT" | "DAI" | "JPY";
type CryptoChain = "ethereum" | "optimism" | "arbitrum" | "base";
type TokenPaymentMethod = Exclude<PaymentMethod, "ETH" | "JPY">;

type StorySectionContent = {
  heading: string;
  imageAlt: string;
  body: string[];
};

type TeamSectionContent = {
  heading: string;
  teamHeading: string;
  updatesHeading: string;
  viewAll: string;
  profileFallback: string;
  updates: string[];
};

type FaqItemRaw = {
  question: string;
  answer?: string;
  answerKey?: string;
};

type SponsorInfo = {
  names: Record<string, string> & { default: string };
  logo: string | null;
};

type PillarStep = {
  key: string;
  label: string;
};

type PillarCard = {
  key: string;
  title: string;
  subtitle: string;
  bullets: string[];
};

type PillarsSectionContent = {
  heading: string;
  steps: PillarStep[];
  cards: PillarCard[];
};

const DONATION_ADDRESS = "0xa1a8d76a0044ce9d8aef7c5279111a3029f58a6a";
const CHAIN_ID_MAP: Record<CryptoChain, number> = {
  ethereum: 1,
  optimism: 10,
  arbitrum: 42161,
  base: 8453,
};
const WEI_FACTOR = BigInt("1000000000000000000");
const DECIMAL_FORMATTER = new Intl.NumberFormat("en-US", { maximumSignificantDigits: 21, useGrouping: false });

const WALLETCONNECT_METADATA = {
  name: "Nyx Foundation",
  description: "Nyx Foundation donations",
  url: "https://nyx.foundation",
  icons: ["https://nyx.foundation/icon.png"],
};

const WALLETCONNECT_RELAY_URL = "wss://relay.walletconnect.com";
const WALLETCONNECT_METHODS = ["eth_sendTransaction"] as const;
const WALLETCONNECT_EVENTS = ["accountsChanged", "chainChanged"] as const;
const DEFAULT_GAS_HEX = "0x5208"; // 21000 gas for native transfers
const TOKEN_TRANSFER_GAS_HEX = "0x186a0"; // 100000 gas for ERC-20 transfers

const ERC20_METADATA: Record<TokenPaymentMethod, { decimals: number; contracts: Partial<Record<CryptoChain, `0x${string}`>> }> = {
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

const toWei = (amount: number) => {
  const sanitized = Number.isFinite(amount) ? Math.max(amount, 0) : 0;
  if (sanitized === 0) {
    return BigInt(0);
  }
  const decimal = DECIMAL_FORMATTER.format(sanitized);
  const [integerPart, fractionPart = ""] = decimal.split(".");
  const fraction = fractionPart.padEnd(18, "0").slice(0, 18);
  const integerWei = BigInt(integerPart) * WEI_FACTOR;
  const fractionalWei = fraction ? BigInt(fraction) : BigInt(0);
  return integerWei + fractionalWei;
};

const toHexWei = (amount: number) => {
  const wei = toWei(amount);
  if (wei === BigInt(0)) {
    return "0x0";
  }
  return `0x${wei.toString(16)}`;
};

const isUserRejectedRequest = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }
  const maybe = error as { code?: number; message?: string };
  if (typeof maybe.code === "number" && (maybe.code === 4001 || maybe.code === 5000)) {
    return true;
  }
  if (typeof maybe.message === "string") {
    const lower = maybe.message.toLowerCase();
    return lower.includes("user rejected") || lower.includes("rejected by user") || lower.includes("user cancelled");
  }
  return false;
};

const toHexChainId = (chainId: number) => `0x${chainId.toString(16)}`;

const toBaseUnits = (amount: number, decimals: number) => {
  const sanitized = Number.isFinite(amount) ? Math.max(amount, 0) : 0;
  if (sanitized === 0) {
    return BigInt(0);
  }
  const decimal = DECIMAL_FORMATTER.format(sanitized);
  const [integerPart, fractionPart = ""] = decimal.split(".");
  const fraction = fractionPart.padEnd(decimals, "0").slice(0, decimals);
  const digits = `${integerPart}${fraction}`.replace(/^0+/, "");
  const normalized = digits.length > 0 ? digits : "0";
  return BigInt(normalized);
};

const encodeErc20Transfer = (recipient: string, amount: bigint) => {
  const selector = "a9059cbb"; // transfer(address,uint256)
  const addressPart = recipient.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  const amountPart = amount.toString(16).padStart(64, "0");
  return `0x${selector}${addressPart}${amountPart}`;
};

const shortenAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

const ETH_TO_USD = 4500;
const USD_TO_JPY = 145;
const ETH_TO_JPY = ETH_TO_USD * USD_TO_JPY;

const DISTRIBUTION_COUNTS = [6, 3, 1];

const NUMBER_LOCALE_MAP: Record<string, string> = {
  ja: "en-US",
};

const STORY_LAYOUTS = [
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

const PILLAR_METADATA: Record<
  string,
  {
    icon: LucideIcon;
    stepColor: string;
    iconWrapperClass: string;
    titleClassName?: string;
  }
> = {
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

const FIXED_AMOUNTS: Record<PaymentMethod, readonly number[]> = {
  ETH: [0.15, 1.5, 7.5],
  USDC: [600, 6_000, 30_000],
  USDT: [600, 6_000, 30_000],
  DAI: [600, 6_000, 30_000],
  JPY: [93_000, 930_000, 4_500_000],
};

const SUPPORT_TIER_ETH_AMOUNTS = {
  supporter: 0.15,
  sponsor: 1.5,
  premium: 7.5,
} as const;

const TIER_AMOUNT_BADGES = {
  supporter: "0.15 ETH+",
  sponsor: "1.5 ETH+",
  premium: "7.5 ETH+",
} as const;

const convertMethodAmountToEth = (amount: number, method: PaymentMethod) => {
  switch (method) {
    case "JPY":
      return amount / ETH_TO_JPY;
    case "ETH":
      return amount;
    case "USDC":
    case "USDT":
    case "DAI":
    default:
      return amount / ETH_TO_USD;
  }
};

const formatMethodAmount = (amount: number, method: PaymentMethod, locale: string) => {
  if (method === "JPY") {
    return `${Math.round(amount).toLocaleString(locale)}円`;
  }

  if (method === "ETH") {
    const options =
      amount >= 1
        ? { minimumFractionDigits: 0, maximumFractionDigits: 2 }
        : { minimumFractionDigits: 2, maximumFractionDigits: 4 };
    return `${amount.toLocaleString(locale, options)} ETH`;
  }

  const displayLocale = NUMBER_LOCALE_MAP[locale] ?? locale;
  const isWhole = Math.abs(amount - Math.round(amount)) < 1e-6;
  return `${amount.toLocaleString(displayLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: isWhole ? 0 : 2,
  })} ${method}`;
};

export default function ContributionPage() {
  const t = useTranslations("contribution");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const donationCardRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  // Donation UI state (one-time only, default crypto)
  const [selectedChain, setSelectedChain] = useState<CryptoChain>("ethereum");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("ETH");
  const [selectedAmountIndex, setSelectedAmountIndex] = useState(0);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [selectedMember, setSelectedMember] = useState<null | { id: string; name: string; role: string; avatar?: string; bio?: string }>(null);
  const [newsMap, setNewsMap] = useState<Record<string, { href: string; external: boolean }>>({});
  const [signClient, setSignClient] = useState<SignClient | null>(null);
  const [walletConnectSession, setWalletConnectSession] = useState<SessionTypes.Struct | null>(null);
  const [walletConnectUri, setWalletConnectUri] = useState<string>("");
  const [walletConnectLoading, setWalletConnectLoading] = useState(false);
  const [walletConnectErrorKey, setWalletConnectErrorKey] = useState<string | null>(null);
  const [isDonationOverlayOpen, setDonationOverlayOpen] = useState(false);
  const [activeTier, setActiveTier] = useState<keyof typeof SUPPORT_TIER_ETH_AMOUNTS | null>(null);

  const paymentOptions: { value: PaymentMethod; label: string; type: "crypto" | "fiat" }[] = [
    { value: "ETH", label: t("supportSection.paymentOptions.ETH"), type: "crypto" },
    { value: "USDC", label: t("supportSection.paymentOptions.USDC"), type: "crypto" },
    { value: "USDT", label: t("supportSection.paymentOptions.USDT"), type: "crypto" },
    { value: "DAI", label: t("supportSection.paymentOptions.DAI"), type: "crypto" },
    { value: "JPY", label: t("supportSection.paymentOptions.JPY"), type: "fiat" },
  ];

  const cryptoChains = useMemo(
    () => [
      { value: "ethereum" as const, label: t("supportSection.chainOptions.ethereum"), color: "bg-gray-500" },
      { value: "optimism" as const, label: t("supportSection.chainOptions.optimism"), color: "bg-red-500" },
      { value: "arbitrum" as const, label: t("supportSection.chainOptions.arbitrum"), color: "bg-blue-500" },
      { value: "base" as const, label: t("supportSection.chainOptions.base"), color: "bg-sky-500" },
    ],
    [t]
  );

  // Team members (fill with real data and avatars under public/team)
  const teamMembers = [
    { id: "vita", name: "vita", role: "Consensus / MEV", avatar: "/residents/vita.jpeg", bio: "Consensus and MEV research, protocol direction." },
    { id: "gohan", name: "gohan", role: "zkVM / Whitehat", avatar: "/residents/gohan.jpg", bio: "zkVM research and whitehat security contributions." },
    { id: "banri", name: "banri", role: "Formal Verification", avatar: "/residents/banri.jpeg", bio: "Specs, proofs, and verification tooling." },
    { id: "adust", name: "adust", role: "VOLE / MPC", avatar: "/residents/adust.jpg", bio: "MPC and VOLE implementations." },
    { id: "tomo", name: "tomo", role: "CrossChain / Interoperability", avatar: "/residents/tomo.jpg", bio: "CrossChain protocols and interoperability research." },
    { id: "alpha", name: "Alphaist", role: "MEV / DeFi", avatar: "/residents/alpha.jpeg", bio: "MEV, DeFi, and market microstructure." },
    { id: "hiro", name: "Hiro", role: "MEV / PBS", avatar: "/residents/tei.jpeg", bio: "MEV, PBS, and mechanism design." },
  ];

  const corporateSponsors: SponsorInfo[] = [
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
  const individualSupporters: SponsorInfo[] = [
    {
      names: { default: "DeSci Tokyo", ja: "デサイ東京" },
      logo: "/sponsors/desci.jpg",
    },
  ];

  const getLocalizedName = (entry: SponsorInfo) => entry.names[locale] ?? entry.names.default;

  const supportBulletsRaw = t.raw("supportSection.bullets");
  const supportBullets = Array.isArray(supportBulletsRaw) ? (supportBulletsRaw as string[]) : [];
  const premiumBenefitsRaw = t.raw("supportSection.benefitsPremium");
  const premiumBenefits = Array.isArray(premiumBenefitsRaw) ? (premiumBenefitsRaw as SupportBenefit[]) : [];
  const sponsorBenefitsRaw = t.raw("supportSection.benefitsSponsor");
  const sponsorBenefits = Array.isArray(sponsorBenefitsRaw) ? (sponsorBenefitsRaw as SupportBenefit[]) : [];
  const supporterBenefitsRaw = t.raw("supportSection.benefitsSupporter");
  const supporterBenefits = Array.isArray(supporterBenefitsRaw) ? (supporterBenefitsRaw as SupportBenefit[]) : [];
  const premiumBenefitsHeading = t("supportSection.benefitsPremiumHeading");
  const sponsorBenefitsHeading = t("supportSection.benefitsSponsorHeading");
  const supporterBenefitsHeading = t("supportSection.benefitsSupporterHeading");
  const heroHeading = t("pageHero.heading");
  const heroDescription = t.rich("pageHero.description", {
    highlight: (chunks) => <span className="font-semibold">{chunks}</span>,
  });
  const storySectionsRaw = t.raw("storySections");
  const storySections = Array.isArray(storySectionsRaw) ? (storySectionsRaw as StorySectionContent[]) : [];
  const storyContent = storySections.map((section, index) => {
    const layout = STORY_LAYOUTS[index] ?? STORY_LAYOUTS[STORY_LAYOUTS.length - 1];
    return { ...section, layout };
  });
  const pillarsSectionRaw = t.raw("pillarsSection");
  const pillarsSection =
    pillarsSectionRaw && typeof pillarsSectionRaw === "object"
      ? (pillarsSectionRaw as PillarsSectionContent)
      : null;
  const pillarsHeading = pillarsSection?.heading ?? "";
  const pillarSteps = pillarsSection?.steps ?? [];
  const pillarCards = pillarsSection?.cards ?? [];
  const teamSectionRaw = t.raw("teamSection");
  const teamSectionContent =
    teamSectionRaw && typeof teamSectionRaw === "object" ? (teamSectionRaw as TeamSectionContent) : null;
  const teamSectionHeading = teamSectionContent?.heading ?? "";
  const teamCardHeading = teamSectionContent?.teamHeading ?? "";
  const teamUpdatesHeading = teamSectionContent?.updatesHeading ?? "";
  const teamViewAllLabel = teamSectionContent?.viewAll ?? "";
  const teamProfileFallback = teamSectionContent?.profileFallback ?? "";
  const teamUpdates = teamSectionContent?.updates ?? [];
  const faqItemsRaw = t.raw("faqSection.items");
  const faqItems = Array.isArray(faqItemsRaw)
    ? (faqItemsRaw as FaqItemRaw[]).map((item) => ({
        question: item.question,
        answer: item.answerKey ? t(item.answerKey) : item.answer ?? "",
      }))
    : [];
  const faqHeading = t("faqSection.heading");
  const faqDescription = t("faqSection.description");
  const faqContactCta = t("faqSection.contactCta");
  const copyLabel = tCommon("copy");
  const closeOverlayAria = t("supportSection.closeOverlayAria");
  const supportUseCasesHeading = t("supportSection.useCasesHeading");
  const supportersHeading = t("supportersSection.heading");
  const sponsorTitle = t("supportersSection.sponsorTitle");
  const supporterTitle = t("supportersSection.supporterTitle");
  const supportHeading = t("supportSection.heading");
  const supportIntro = t("supportSection.intro");
  const supportTiers = t("supportSection.tiers");
  const supportNote = t("supportSection.note");
  const supportOrganizationsCta = t("supportSection.organizationsCta");
  const bankNameLabel = t("howToDonate.bankTransfer.bankName");
  const branchNameLabel = t("howToDonate.bankTransfer.branchName");
  const accountNumberLabel = t("howToDonate.bankTransfer.accountNumber");
  const accountNameLabel = t("howToDonate.bankTransfer.accountName");
  const supportAmountLabel = t("supportSection.amountLabel");
  const selectionStepLabel = t("supportSection.selectionStep.label");
  const selectionStepTitle = t("supportSection.selectionStep.title");
  const selectionStepDescription = t("supportSection.selectionStep.description");
  const tierHeadingByKey: Record<keyof typeof SUPPORT_TIER_ETH_AMOUNTS, string> = {
    premium: premiumBenefitsHeading,
    sponsor: sponsorBenefitsHeading,
    supporter: supporterBenefitsHeading,
  };
  const activeTierHeading = activeTier ? tierHeadingByKey[activeTier] : null;
  const activeTierBadge = activeTier ? TIER_AMOUNT_BADGES[activeTier] : null;
  const supportMethodLabel = t("supportSection.methodLabel");
  const supportChainLabel = t("supportSection.chainLabel");
  const stepOneLabel = t("supportSection.steps.step1.label");
  const stepOneTitle = t("supportSection.steps.step1.title");
  const stepOneDescription = t("supportSection.steps.step1.description");
  const stepOneFiatDescription = t("supportSection.steps.step1.fiatDescription");
  const stepStatusPending = t("supportSection.steps.status.pending");
  const stepStatusComplete = t("supportSection.steps.status.complete");
  const stepStatusAction = t("supportSection.steps.status.action");
  const stepStatusReady = t("supportSection.steps.status.ready");
  const stepStatusSkipped = t("supportSection.steps.status.skipped");
  const stepTwoLabel = t("supportSection.steps.step2.label");
  const stepTwoTitle = t("supportSection.steps.step2.title");
  const stepTwoDescription = t("supportSection.steps.step2.description");
  const stepTwoFiatDescription = t("supportSection.steps.step2.fiatDescription");
  const distributionPeopleSuffix = t("supportSection.peopleSuffix");
  const supportDonateCta = t("supportSection.donateCta");
  const supportCompleteCta = t("supportSection.completeCta");
  const walletConnectFallbackNote = t.rich("supportSection.wcFallbackNote", {
    contactLink: (chunks) => (
      <Link href="/contact" className="underline underline-offset-2">
        {chunks}
      </Link>
    ),
    address: (chunks) => <span className="font-mono break-all text-foreground/80">{chunks}</span>,
  });
  useEffect(() => {
    // Build a quick index of News items to link achievements to the same targets
    fetch('/api/test-notion')
      .then((res) => res.json())
      .then((data) => {
        if (!data?.news) return;
        const countsJa: Record<string, number> = {};
        const countsEn: Record<string, number> = {};
        for (const n of data.news) {
          countsJa[n.title] = (countsJa[n.title] || 0) + 1;
          countsEn[n.titleEn] = (countsEn[n.titleEn] || 0) + 1;
        }
        const map: Record<string, { href: string; external: boolean }> = {};
        for (const n of data.news) {
          const href = n.redirectTo || `/news/${n.slug}`;
          if (countsJa[n.title] === 1) map[n.title] = { href, external: Boolean(n.redirectTo) };
          if (countsEn[n.titleEn] === 1) map[n.titleEn] = { href, external: Boolean(n.redirectTo) };
        }
        setNewsMap(map);
      })
      .catch(() => void 0);
  }, []);

  const isFiatJPY = selectedMethod === "JPY";
  const selectedTokenMeta =
    selectedMethod === "ETH" || selectedMethod === "JPY"
      ? null
      : ERC20_METADATA[selectedMethod as TokenPaymentMethod];
  const availableCryptoChains = useMemo(() => {
    if (isFiatJPY || selectedMethod === "ETH") {
      return cryptoChains;
    }
    const tokenMeta = selectedTokenMeta;
    if (!tokenMeta) {
      return cryptoChains;
    }
    const filtered = cryptoChains.filter((chain) => Boolean(tokenMeta.contracts[chain.value]));
    return filtered.length > 0 ? filtered : cryptoChains;
  }, [cryptoChains, isFiatJPY, selectedMethod, selectedTokenMeta]);
  const methodAmounts = useMemo(() => FIXED_AMOUNTS[selectedMethod] ?? [], [selectedMethod]);
  const safeAmountIndex = Math.min(selectedAmountIndex, Math.max(methodAmounts.length - 1, 0));
  const currentMethodAmount = methodAmounts[safeAmountIndex] ?? 0;
  const currentEthAmount = convertMethodAmountToEth(currentMethodAmount, selectedMethod);
  const formattedAmount = formatMethodAmount(currentMethodAmount, selectedMethod, locale);
  const currentAmount = currentMethodAmount;
  const availableChainValues = availableCryptoChains.map((chain) => chain.value);
  const chainIndex = availableCryptoChains.findIndex((chain) => chain.value === selectedChain);
  const safeChainIndex = chainIndex === -1 ? 0 : chainIndex;
  const distributionData = methodAmounts.map((amount, idx) => ({
    label: formatMethodAmount(amount, selectedMethod, locale),
    count: DISTRIBUTION_COUNTS[idx] ?? 0,
  }));
  const activeBucketIndex = safeAmountIndex;

  useEffect(() => {
    if (isFiatJPY) {
      return;
    }
    if (availableChainValues.length === 0) {
      return;
    }
    if (!availableChainValues.includes(selectedChain)) {
      setSelectedChain(availableChainValues[0]);
    }
  }, [availableChainValues, isFiatJPY, selectedChain]);

  useEffect(() => {
    if (methodAmounts.length === 0) {
      if (selectedAmountIndex !== 0) {
        setSelectedAmountIndex(0);
      }
      return;
    }
    if (selectedAmountIndex >= methodAmounts.length) {
      setSelectedAmountIndex(methodAmounts.length - 1);
    }
  }, [methodAmounts, selectedAmountIndex]);
  const selectedTokenContract = selectedTokenMeta?.contracts[selectedChain] ?? null;
  const selectedTokenDecimals = selectedTokenMeta?.decimals ?? 0;
  const isTokenPayment = Boolean(selectedTokenMeta);

  const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
  const isWalletConnectEligible = !isFiatJPY && (selectedMethod === "ETH" || Boolean(selectedTokenContract));
  const targetChainId = CHAIN_ID_MAP[selectedChain] ?? CHAIN_ID_MAP.ethereum;
  const targetChainIdString = String(targetChainId);
  const targetChainIdHex = toHexChainId(targetChainId);
  const targetNamespace = `eip155:${targetChainIdString}`;

  const walletConnectAccounts = useMemo(() => {
    if (!walletConnectSession) {
      return [] as string[];
    }
    return walletConnectSession.namespaces.eip155?.accounts ?? [];
  }, [walletConnectSession]);

  const walletConnectAccountForTarget = useMemo(() => {
    return walletConnectAccounts.find((account) => account.startsWith(`${targetNamespace}:`)) ?? null;
  }, [walletConnectAccounts, targetNamespace]);

  const walletConnectPrimaryAccount = walletConnectAccounts[0] ?? null;

  const walletConnectAddressForTarget = useMemo(() => {
    if (!walletConnectAccountForTarget) return null;
    const parts = walletConnectAccountForTarget.split(":");
    return parts[2] ?? null;
  }, [walletConnectAccountForTarget]);

  const walletConnectPrimaryAddress = useMemo(() => {
    if (!walletConnectPrimaryAccount) return null;
    const parts = walletConnectPrimaryAccount.split(":");
    return parts[2] ?? null;
  }, [walletConnectPrimaryAccount]);

  const walletConnectSupportsTargetChain = Boolean(walletConnectAccountForTarget);

  const walletConnectErrorMessages: Record<string, string> = {
    wcUnavailable: t("supportSection.wcUnavailable"),
    wcInitError: t("supportSection.wcInitError"),
    wcConnectError: t("supportSection.wcConnectError"),
  };
  const walletConnectError = walletConnectErrorKey ? walletConnectErrorMessages[walletConnectErrorKey] ?? null : null;
  const isStepOneComplete = isWalletConnectEligible
    ? Boolean(walletConnectSession && walletConnectSupportsTargetChain && walletConnectAddressForTarget)
    : true;
  const canSendDonation = !isWalletConnectEligible || isStepOneComplete;
  const isStepOneSkipped = isFiatJPY;
  const stepOneStatusLabel = isStepOneSkipped ? stepStatusSkipped : isStepOneComplete ? stepStatusComplete : stepStatusPending;
  const stepTwoStatusLabel = canSendDonation ? stepStatusReady : stepStatusAction;
  const stepOneStatusClass = isStepOneSkipped ? "text-muted-foreground" : isStepOneComplete ? "text-emerald-600" : "text-muted-foreground";
  const stepTwoStatusClass = canSendDonation ? "text-emerald-600" : "text-amber-600";
  const donateButtonLabel = isFiatJPY ? supportCompleteCta : supportDonateCta;

  useEffect(() => {
    if (signClient) {
      return;
    }
    if (!walletConnectProjectId) {
      setWalletConnectErrorKey("wcUnavailable");
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const client = await SignClient.init({
          projectId: walletConnectProjectId,
          relayUrl: WALLETCONNECT_RELAY_URL,
          metadata: WALLETCONNECT_METADATA,
        });
        if (!cancelled) {
          setWalletConnectErrorKey(null);
          setSignClient(client);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setWalletConnectErrorKey("wcInitError");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signClient, t, walletConnectProjectId]);

  useEffect(() => {
    if (!signClient) return;

    const handleDelete = (event: SignClientTypes.EventArguments["session_delete"]) => {
      setWalletConnectSession((prev) => (prev?.topic === event.topic ? null : prev));
      setWalletConnectUri("");
    };

    const handleUpdate = (event: SignClientTypes.EventArguments["session_update"]) => {
      setWalletConnectSession((prev) => {
        if (!prev || prev.topic !== event.topic) {
          return prev;
        }
        return { ...prev, namespaces: event.params.namespaces };
      });
    };

    signClient.on("session_delete", handleDelete);
    signClient.on("session_update", handleUpdate);

    return () => {
      signClient.off("session_delete", handleDelete);
      signClient.off("session_update", handleUpdate);
    };
  }, [signClient]);

  const startWalletConnect = useCallback(async () => {
    if (!signClient || !isWalletConnectEligible || walletConnectLoading) {
      return;
    }
    setWalletConnectLoading(true);
    setWalletConnectErrorKey(null);
    try {
      if (walletConnectSession) {
        await signClient.disconnect({
          topic: walletConnectSession.topic,
          reason: { code: 6000, message: "Session replaced" },
        });
        setWalletConnectSession(null);
      }
      const { uri, approval } = await signClient.connect({
        requiredNamespaces: {
          eip155: {
            chains: [targetNamespace],
            methods: [...WALLETCONNECT_METHODS],
            events: [...WALLETCONNECT_EVENTS],
          },
        },
      });
      if (uri) {
        setWalletConnectUri(uri);
      }
      const session = await approval();
      setWalletConnectSession(session);
      setWalletConnectUri("");
    } catch (error) {
      console.error(error);
      setWalletConnectErrorKey("wcConnectError");
    } finally {
      setWalletConnectLoading(false);
    }
  }, [signClient, isWalletConnectEligible, targetNamespace, walletConnectLoading, walletConnectSession]);

  useEffect(() => {
    if (!signClient || !isWalletConnectEligible) {
      return;
    }
    const hasActiveSession = Boolean(walletConnectSession);
    if (!hasActiveSession && !walletConnectUri && !walletConnectLoading) {
      void startWalletConnect();
    }
  }, [signClient, isWalletConnectEligible, walletConnectSession, walletConnectUri, walletConnectLoading, startWalletConnect]);

  useEffect(() => {
    if (!isWalletConnectEligible) {
      setWalletConnectErrorKey(null);
    }
    if (!isWalletConnectEligible && walletConnectSession && signClient) {
      signClient
        .disconnect({ topic: walletConnectSession.topic, reason: { code: 6001, message: "Donation method changed" } })
        .catch((error) => console.error(error));
      setWalletConnectSession(null);
      setWalletConnectUri("");
    }
  }, [isWalletConnectEligible, signClient, walletConnectSession]);

  const resetWalletConnect = useCallback(async () => {
    setWalletConnectErrorKey(null);
    setWalletConnectUri("");
    if (walletConnectSession && signClient) {
      try {
        await signClient.disconnect({
          topic: walletConnectSession.topic,
          reason: { code: 6002, message: "Reset by user" },
        });
      } catch (error) {
        console.error(error);
      }
    }
    setWalletConnectSession(null);
    if (isWalletConnectEligible) {
      void startWalletConnect();
    }
  }, [isWalletConnectEligible, signClient, startWalletConnect, walletConnectSession]);

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const handleMethodChange = useCallback((method: PaymentMethod) => {
    setSelectedMethod(method);
    setSelectedAmountIndex(0);
  }, []);

  const handleChainSelect = useCallback(
    (index: number) => {
      const target = availableCryptoChains[index]?.value;
      if (target) {
        setSelectedChain(target);
      }
    },
    [availableCryptoChains]
  );

  const handleAmountSelect = useCallback((index: number) => {
    setSelectedAmountIndex(index);
  }, []);

  const handleTierClick = useCallback(
    (tier: keyof typeof SUPPORT_TIER_ETH_AMOUNTS) => {
      const targetEth = SUPPORT_TIER_ETH_AMOUNTS[tier];
      const ethAmounts = FIXED_AMOUNTS.ETH ?? [];
      const foundIndex = ethAmounts.findIndex((value) => Math.abs(value - targetEth) < 1e-9);
      const targetIndex = foundIndex === -1 ? 0 : foundIndex;

      setActiveTier(tier);
      handleMethodChange("ETH");
      setSelectedAmountIndex(targetIndex);
      lastFocusedElementRef.current = (document.activeElement as HTMLElement) ?? null;
      setDonationOverlayOpen(true);
    },
    [handleMethodChange]
  );

  const getDisplayAmount = () => formattedAmount;

  const toggleFAQ = (idx: number) =>
    setOpenFAQ((prev) => (prev === idx ? null : idx));

  const handleCloseOverlay = useCallback(() => {
    setDonationOverlayOpen(false);
    setActiveTier(null);
    const previousFocus = lastFocusedElementRef.current;
    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
    lastFocusedElementRef.current = null;
  }, []);

  const handleOverlayKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleCloseOverlay();
      }
    },
    [handleCloseOverlay]
  );

  useEffect(() => {
    if (!isDonationOverlayOpen) {
      return;
    }
    const timer = window.setTimeout(() => {
      donationCardRef.current?.focus({ preventScroll: true });
    }, 40);
    return () => window.clearTimeout(timer);
  }, [isDonationOverlayOpen]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    if (isDonationOverlayOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isDonationOverlayOpen]);

  const handlePayment = useCallback(async () => {
    if (isWalletConnectEligible) {
      if (!walletConnectProjectId) {
        alert(t("supportSection.wcNeedsProject"));
        return;
      }
      if (!signClient) {
        alert(t("supportSection.wcInitPending"));
        return;
      }
      if (!walletConnectSession) {
        alert(t("supportSection.wcConnectPrompt"));
        void startWalletConnect();
        return;
      }
      if (!walletConnectAddressForTarget) {
        alert(
          t("supportSection.wcChainMismatch", {
            chain: availableCryptoChains[safeChainIndex]?.label ?? "",
          })
        );
        return;
      }
      try {
        const txParams = (() => {
          if (isTokenPayment) {
            if (!selectedTokenContract) {
              throw new Error("Token contract unavailable for selected chain.");
            }
            const baseUnits = toBaseUnits(currentAmount, selectedTokenDecimals);
            if (baseUnits === BigInt(0)) {
              throw new Error("Amount must be greater than zero.");
            }
            return {
              from: walletConnectAddressForTarget,
              to: selectedTokenContract,
              value: "0x0",
              gas: TOKEN_TRANSFER_GAS_HEX,
              chainId: targetChainIdHex,
              data: encodeErc20Transfer(DONATION_ADDRESS, baseUnits),
            } as const;
          }
          return {
            from: walletConnectAddressForTarget,
            to: DONATION_ADDRESS,
            value: toHexWei(currentEthAmount),
            gas: DEFAULT_GAS_HEX,
            chainId: targetChainIdHex,
            data: "0x",
          } as const;
        })();
        const txHash = await signClient.request({
          topic: walletConnectSession.topic,
          chainId: targetNamespace,
          request: {
            method: "eth_sendTransaction",
            params: [txParams],
          },
        });
        const params = new URLSearchParams();
        params.set("amount", currentAmount.toString());
        params.set("displayAmount", formattedAmount);
        params.set("method", selectedMethod);
        if (!isFiatJPY) {
          params.set("chain", selectedChain);
        }
        const donorAddress = walletConnectAddressForTarget ?? walletConnectPrimaryAddress ?? "";
        if (donorAddress) {
          params.set("address", donorAddress);
        }
        if (typeof txHash === "string" && txHash) {
          params.set("txHash", txHash);
        }
        const query = params.toString();
        router.push(`/thankyou-donation${query ? `?${query}` : ""}`);
      } catch (error) {
        console.error(error);
        if (isUserRejectedRequest(error)) {
          alert(t("supportSection.wcRequestRejected"));
        } else {
          const message = error instanceof Error ? error.message : String(error);
          alert(`${t("supportSection.wcRequestError")}\n${message}`);
        }
      }
      return;
    }
    const params = new URLSearchParams();
    params.set("amount", currentAmount.toString());
    params.set("displayAmount", formattedAmount);
    params.set("method", selectedMethod);
    if (!isFiatJPY) {
      params.set("chain", selectedChain);
    }
    const query = params.toString();
    router.push(`/thankyou-donation${query ? `?${query}` : ""}`);
  }, [
    availableCryptoChains,
    currentAmount,
    currentEthAmount,
    formattedAmount,
    isFiatJPY,
    isWalletConnectEligible,
    isTokenPayment,
    router,
    safeChainIndex,
    signClient,
    startWalletConnect,
    t,
    targetNamespace,
    targetChainIdHex,
    selectedTokenContract,
    selectedTokenDecimals,
    selectedChain,
    selectedMethod,
    walletConnectPrimaryAddress,
    walletConnectAddressForTarget,
    walletConnectProjectId,
    walletConnectSession,
  ]);

  return (
    <div className="min-h-screen px-5 md:px-8 pt-10 md:pt-12 pb-24 md:pb-32">
      <div className="container mx-auto max-w-6xl">
        {/* Hero (donation card moved below) */}
        <section className="relative grid grid-cols-1 items-start mb-28 md:mb-36 overflow-hidden pt-24 sm:pt-28 md:pt-40">
          <div className="relative z-10 space-y-5 md:space-y-6">
            {/* subtle background icon anchored to heading for consistent mobile/desktop positioning */}
            <div className="pointer-events-none select-none absolute z-0 -left-6 top-[-108px] md:top-[-140px] w-[180px] md:w-[260px] opacity-10">
              <Image
                src="/icon.svg"
                alt=""
                aria-hidden
                fill
                sizes="(min-width: 768px) 260px, 180px"
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">{heroHeading}</h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{heroDescription}</p>
            <Link
              href="#support-nyx"
              className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-lime-300 via-emerald-400 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_0_22px_rgba(74,222,128,0.45)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(16,185,129,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
            >
              {supportHeading}
            </Link>
            {/* サブスク文言は削除（今回のみの寄付に統一） */}
          </div>
        </section>

        {storyContent.map((section, idx) => (
          <section key={`${section.heading}-${idx}`} className="bg-muted/50 rounded-2xl p-12 md:p-14 mb-28 md:mb-36">
            <div className={`max-w-6xl mx-auto ${section.layout.wrapperSpacingClass}`}>
              <h2 className="text-2xl md:text-3xl font-bold text-center md:whitespace-nowrap">{section.heading}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-7 md:gap-9 items-center">
                <div className={section.layout.textContainerClass}>
                  {section.body.map((paragraph, paragraphIndex) => (
                    <p key={`${section.heading}-paragraph-${paragraphIndex}`}>{paragraph}</p>
                  ))}
                </div>
                <div className={section.layout.imageContainerClass}>
                  <div className="relative w-full aspect-[16/9] md:aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-sm">
                    <Image
                      src={section.layout.imageSrc}
                      alt={section.imageAlt}
                      fill
                      sizes={section.layout.imageSizes}
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* Team Member Modal */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-md rounded-xl bg-white shadow-lg ring-1 ring-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    {selectedMember.avatar ? (
                      <Image
                        src={selectedMember.avatar}
                        alt={selectedMember.name}
                        fill
                        sizes="40px"
                        className="object-cover rounded-full ring-1 ring-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted ring-1 ring-gray-200" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{selectedMember.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedMember.role}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} className="text-sm text-muted-foreground hover:text-foreground">{t("common.close")}</button>
              </div>
              <div className="p-5">
                <p className="text-sm leading-relaxed text-foreground/80">{selectedMember.bio || teamProfileFallback}</p>
              </div>
            </div>
          </div>
        )}

        {pillarsHeading && pillarCards.length > 0 && (
          <section className="bg-muted/50 rounded-2xl p-12 md:p-14 mb-28 md:mb-36">
            <div className="max-w-6xl mx-auto space-y-12 md:space-y-14">
              <h3 className="text-2xl md:text-3xl font-bold text-center md:whitespace-nowrap">{pillarsHeading}</h3>

              <div className="relative">
                <div className="absolute left-0 right-0 top-[7px] h-[2px] bg-gray-200" />
                <ol className="relative z-10 grid grid-cols-3 gap-4">
                  {pillarSteps.map((step) => {
                    const meta = PILLAR_METADATA[step.key] ?? PILLAR_METADATA.secure;
                    return (
                      <li key={step.key} className="flex flex-col items-center text-center">
                        <span className={`w-3.5 h-3.5 rounded-full ring-4 ring-white ${meta.stepColor}`} />
                        <span className="mt-2 text-sm font-medium">{step.label}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                {pillarCards.map((card) => {
                  const meta = PILLAR_METADATA[card.key] ?? PILLAR_METADATA.secure;
                  const Icon = meta.icon;
                  const titleClassName = meta.titleClassName
                    ? `font-semibold ${meta.titleClassName}`
                    : "font-semibold";
                  return (
                    <div key={card.key} className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={meta.iconWrapperClass}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h4 className={titleClassName}>{card.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{card.subtitle}</p>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {card.bullets.map((bullet, bulletIdx) => (
                          <li key={`${card.key}-bullet-${bulletIdx}`}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
        {teamSectionHeading && (
          <section className="bg-muted/50 rounded-2xl p-12 md:p-14 mb-28 md:mb-36">
            <div className="max-w-6xl mx-auto space-y-12 md:space-y-14">
              <h3 className="text-2xl md:text-3xl font-bold text-center md:whitespace-nowrap">{teamSectionHeading}</h3>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <h4 className="font-semibold mb-3">{teamCardHeading}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {teamMembers.map((m) => (
                      <button key={m.id} onClick={() => setSelectedMember(m)} className="flex flex-col items-center gap-2 group">
                        <div className="relative w-20 h-20">
                          {m.avatar ? (
                            <Image
                              src={m.avatar}
                              alt={m.name}
                              fill
                              sizes="80px"
                              className="object-cover rounded-full ring-1 ring-gray-200"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-muted ring-1 ring-gray-200" />
                          )}
                        </div>
                        <span className="text-sm font-medium group-hover:underline">{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <h4 className="font-semibold mb-3">{teamUpdatesHeading}</h4>
                  <div className="space-y-2">
                    {teamUpdates.slice(0, 5).map((title, index) => {
                      const mapped = newsMap[title];
                      const href = mapped?.href || "/news";
                      const isExternal = mapped?.external;
                      return (
                        <div key={`${title}-${index}`} className="py-2 border-b last:border-b-0">
                          {isExternal ? (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                              {title}
                            </a>
                          ) : (
                            <Link href={href} className="text-sm font-medium hover:underline">
                              {title}
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4">
                    <Link href="/news" className="inline-flex items-center h-10 px-4 border border-border rounded-md hover:bg-muted/50">
                      {teamViewAllLabel}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {/* Sponsors & Supporters（グリッド、非スクロール、ロゴ貼り付け） */}
        <section className="mb-28 md:mb-36">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold md:whitespace-nowrap">{supportersHeading}</h2>
            </div>
            {/* 法人・個人メイトを単一コンテナに統合 */}
            <div className="rounded-xl p-12 md:p-14 bg-white shadow-sm ring-1 ring-gray-100">
              <div className="grid grid-cols-1 gap-12 md:gap-14">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold leading-tight mb-8">{sponsorTitle}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
                    {corporateSponsors.map((c) => {
                      const localizedName = getLocalizedName(c);
                      return (
                        <div key={c.names.default} className="flex flex-col items-center gap-3">
                        <div className="relative w-16 h-16 md:w-16 md:h-16">
                            {c.logo ? (
                              <Image src={c.logo} alt={c.names.default} fill className="object-cover rounded-full ring-1 ring-gray-200" />
                            ) : (
                              <div className="w-full h-full bg-muted rounded-full ring-1 ring-gray-200" />
                            )}
                        </div>
                        <div className="text-xs md:text-sm text-center text-foreground/80">
                            {localizedName}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold leading-tight mb-8">{supporterTitle}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
                    {individualSupporters.map((c) => {
                      const localizedName = getLocalizedName(c);
                      return (
                        <div key={c.names.default} className="flex flex-col items-center gap-3">
                        <div className="relative w-16 h-16 md:w-16 md:h-16">
                            {c.logo ? (
                              <Image src={c.logo} alt={c.names.default} fill className="object-cover rounded-full ring-1 ring-gray-200" />
                            ) : (
                              <div className="w-full h-full bg-muted rounded-full ring-1 ring-gray-200 flex items-center justify-center">
                                <HelpCircle className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                        </div>
                        <div className="text-xs md:text-sm text-center text-foreground/80">
                            {localizedName}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 寄付者の声 セクションは削除（要望） */}

        {/* Research Partnership section removed */}

        {/* Support Nyx section (donation card relocated here) */}
        <section id="support-nyx" className="mb-28 md:mb-36">
          <div className="mx-auto max-w-6xl space-y-10 text-left">
            <div className="space-y-3 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold">{supportHeading}</h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{supportIntro}</p>
            </div>

            {supportBullets.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em]">
                  {supportUseCasesHeading}
                </h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {supportBullets.map((item, idx) => (
                    <li
                      key={`${item}-${idx}`}
                      className="flex w-full items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm"
                    >
                      <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                      <span className="text-sm text-emerald-900">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">{supportNote}</p>
              </div>
            )}

            {(premiumBenefits.length > 0 || sponsorBenefits.length > 0 || supporterBenefits.length > 0) && (
              <div className="space-y-3">
                <p className="text-md text-muted-foreground">{supportTiers}</p>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {premiumBenefits.length > 0 && (
                    <SupportTierButton
                      variant="premium"
                      heading={premiumBenefitsHeading}
                      badgeLabel={TIER_AMOUNT_BADGES.premium}
                      benefits={premiumBenefits}
                      onClick={() => handleTierClick("premium")}
                    />
                  )}
                  {sponsorBenefits.length > 0 && (
                    <SupportTierButton
                      variant="sponsor"
                      heading={sponsorBenefitsHeading}
                      badgeLabel={TIER_AMOUNT_BADGES.sponsor}
                      benefits={sponsorBenefits}
                      onClick={() => handleTierClick("sponsor")}
                    />
                  )}
                  {supporterBenefits.length > 0 && (
                    <SupportTierButton
                      variant="supporter"
                      heading={supporterBenefitsHeading}
                      badgeLabel={TIER_AMOUNT_BADGES.supporter}
                      benefits={supporterBenefits}
                      onClick={() => handleTierClick("supporter")}
                    />
                  )}
                </div>
              </div>
            )}

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <Users className="w-4 h-4" /> {supportOrganizationsCta}
            </Link>
          </div>
        </section>

        {isDonationOverlayOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start md:items-center justify-center overflow-y-auto px-4 py-10 md:py-16 bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onKeyDown={handleOverlayKeyDown}
            onClick={(event) => {
              if (event.currentTarget === event.target) {
                handleCloseOverlay();
              }
            }}
          >
            <div className="relative w-full max-w-5xl">
              <button
                type="button"
                onClick={handleCloseOverlay}
                className="absolute -top-10 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                aria-label={closeOverlayAria}
              >
                <X className="h-5 w-5" />
              </button>
              <div
                ref={donationCardRef}
                tabIndex={-1}
                className="outline-none rounded-xl bg-white p-6 md:p-8 shadow-xl ring-1 ring-gray-100 max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-6rem)] overflow-y-auto"
              >
                {activeTierHeading && (
                  <div className="mb-5 flex items-center justify-between gap-3 rounded-lg bg-emerald-50/80 px-4 py-3 text-emerald-900">
                    <span className="text-sm font-semibold">{activeTierHeading}</span>
                    {activeTierBadge && (
                      <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        {activeTierBadge}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex flex-col gap-6 md:gap-7">
                  <div className="border border-border rounded-lg bg-muted/10 p-5 md:p-6 space-y-5 md:space-y-6">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{selectionStepLabel}</div>
                      <h3 className="text-sm font-semibold text-foreground mt-1">{selectionStepTitle}</h3>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{selectionStepDescription}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">{supportMethodLabel}</div>
                      <div className="flex flex-wrap gap-2">
                        {paymentOptions.map((option) => {
                          const isActive = option.value === selectedMethod;
                          return (
                            <button
                              type="button"
                              key={`method-${option.value}`}
                              onClick={() => handleMethodChange(option.value)}
                              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition ${
                                isActive
                                  ? "bg-emerald-600 text-white shadow"
                                  : "bg-white text-foreground ring-1 ring-border hover:bg-muted"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {!isFiatJPY && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">{supportChainLabel}</div>
                        <div className="flex flex-wrap gap-2">
                          {availableCryptoChains.map((chain, idx) => {
                            const isActive = idx === safeChainIndex;
                            return (
                              <button
                                type="button"
                                key={`chain-${chain.value}`}
                                onClick={() => handleChainSelect(idx)}
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                                  isActive
                                    ? "bg-emerald-500 text-white shadow"
                                    : "bg-white text-foreground ring-1 ring-border hover:bg-muted"
                                }`}
                              >
                                <span className={`h-2.5 w-2.5 rounded-full ${chain.color}`} />
                                {chain.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border border-border rounded-lg bg-muted/10 p-5 md:p-6 space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{stepOneLabel}</div>
                        <h3 className="text-sm font-semibold leading-tight text-foreground mt-1">{stepOneTitle}</h3>
                      </div>
                      <div className={`inline-flex items-center gap-1 text-xs font-medium ${stepOneStatusClass}`}>
                        {isStepOneSkipped ? (
                          <Circle className="w-4 h-4" />
                        ) : isStepOneComplete ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                        <span>{stepOneStatusLabel}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{isFiatJPY ? stepOneFiatDescription : stepOneDescription}</p>
                    {isWalletConnectEligible ? (
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => void resetWalletConnect()}
                            disabled={walletConnectLoading || (!walletConnectSession && !walletConnectUri)}
                            className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-xs disabled:opacity-50 disabled:pointer-events-none"
                          >
                            <RefreshCcw className="w-3 h-3" /> {t('supportSection.wcReset')}
                          </button>
                        </div>
                        {walletConnectError && (
                          <p className="text-xs text-red-600">{walletConnectError}</p>
                        )}
                        {walletConnectUri && (
                          <div className="flex justify-center">
                            <div className="rounded-lg bg-white p-4 shadow-sm">
                              <QRCode
                                value={walletConnectUri}
                                size={168}
                                bgColor="#ffffff"
                                fgColor="#111827"
                                style={{ height: '168px', width: '168px' }}
                              />
                            </div>
                          </div>
                        )}
                        {!walletConnectUri && walletConnectLoading && (
                          <p className="text-xs text-muted-foreground">{t('supportSection.wcWaiting')}</p>
                        )}
                        {walletConnectSession && (
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{t('supportSection.wcConnected')}</span>
                              <span className="font-mono text-foreground/90">
                                {shortenAddress(walletConnectAddressForTarget ?? walletConnectPrimaryAddress ?? '') || '—'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{supportChainLabel}</span>
                              <span>{availableCryptoChains[safeChainIndex]?.label ?? ''}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{supportAmountLabel}</span>
                              <span>{formattedAmount}</span>
                            </div>
                            {!walletConnectSupportsTargetChain && (
                              <p className="text-amber-600">
                                {t('supportSection.wcSwitchHint', {
                                  chain: availableCryptoChains[safeChainIndex]?.label ?? '',
                                })}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      !isFiatJPY && (
                        <div className="rounded-lg border border-dashed border-border bg-white/50 p-4 text-xs text-muted-foreground">
                          {t('supportSection.wcDisabled')}
                        </div>
                      )
                    )}
                  </div>

                  <div className="border border-border rounded-lg bg-muted/10 p-5 md:p-6 space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{stepTwoLabel}</div>
                        <h3 className="text-sm font-semibold leading-tight text-foreground mt-1">{stepTwoTitle}</h3>
                      </div>
                      <div className={`inline-flex items-center gap-1 text-xs font-medium ${stepTwoStatusClass}`}>
                        {canSendDonation ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                        <span>{stepTwoStatusLabel}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{isFiatJPY ? stepTwoFiatDescription : stepTwoDescription}</p>
                    {isWalletConnectEligible && !canSendDonation && (
                      <p className="text-xs text-amber-600">{t('supportSection.wcConnectPrompt')}</p>
                    )}
                    {isFiatJPY && (
                      <div className="rounded-lg border border-border bg-white/80 p-4 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{bankNameLabel}</span>
                          <button
                            onClick={() => copyToClipboard(bankNameLabel)}
                            className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-xs"
                          >
                            <Copy className="w-3 h-3" /> {copyLabel}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{branchNameLabel}</span>
                          <button
                            onClick={() => copyToClipboard(branchNameLabel)}
                            className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-xs"
                          >
                            <Copy className="w-3 h-3" /> {copyLabel}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{accountNumberLabel}</span>
                          <button
                            onClick={() => copyToClipboard(accountNumberLabel)}
                            className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-xs"
                          >
                            <Copy className="w-3 h-3" /> {copyLabel}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{accountNameLabel}</span>
                          <button
                            onClick={() => copyToClipboard(accountNameLabel)}
                            className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-xs"
                          >
                            <Copy className="w-3 h-3" /> {copyLabel}
                          </button>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handlePayment}
                      disabled={!canSendDonation}
                      className="relative z-10 w-full h-12 bg-gray-700 text-white rounded-md font-medium shadow-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                      <Heart className="w-4 h-4" /> {donateButtonLabel}{' '}{getDisplayAmount()}
                    </button>
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground leading-relaxed">
                      {walletConnectFallbackNote}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* FAQ */}
        <section className="mb-28 md:mb-36">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-14">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 md:whitespace-nowrap">{faqHeading}</h2>
              <p className="text-muted-foreground">{faqDescription}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
              {faqItems.map((faq, idx) => (
                <div key={`${faq.question}-${idx}`} className="rounded-md bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <button onClick={() => toggleFAQ(idx)} className="w-full p-6 text-left hover:bg-muted/40">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold pr-4 tracking-tight">{faq.question}</h3>
                      {openFAQ === idx ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {openFAQ === idx && (
                    <div className="px-6 pb-6 border-t border-gray-100"><p className="text-muted-foreground leading-relaxed">{faq.answer}</p></div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-10 md:mt-12">
              <p className="text-muted-foreground">{faqContactCta}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
