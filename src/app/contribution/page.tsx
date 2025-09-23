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
  Globe,
  Shirt,
  Calendar,
  BadgeCheck,
  Sparkles,
  HelpCircle,
  RefreshCcw,
  CheckCircle2,
  Circle,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SliderWithMarks } from "@/components/contribution/SliderWithMarks";
import { SupportDistributionChart } from "@/components/contribution/SupportDistributionChart";
import QRCode from "react-qr-code";
import SignClient from "@walletconnect/sign-client";
import type { SignClientTypes, SessionTypes } from "@walletconnect/types";

type PaymentMethod = "ETH" | "USDC" | "USDT" | "DAI" | "JPY";
type CryptoChain = "ethereum" | "optimism" | "arbitrum" | "base";
type TokenPaymentMethod = Exclude<PaymentMethod, "ETH" | "JPY">;
type SupportBenefit = { title: string; description: string };

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

const VARIABLE_STEPS = 6;
const DISTRIBUTION_COUNTS = [10, 18, 34, 20, 12, 6];
const DISTRIBUTION_MORE_COUNT = 4;

const PRESET_ETH_AMOUNTS = [0.01, 0.1, 1, 3, 5, 10] as const;
const PRESET_USD_AMOUNTS = [70, 700, 7_000, 15_000, 20_000, 35_000] as const;
const PRESET_JPY_AMOUNTS = [10_000, 100_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000] as const;

const PRESET_METHOD_AMOUNTS: Record<PaymentMethod, readonly number[]> = {
  ETH: PRESET_ETH_AMOUNTS,
  USDC: PRESET_USD_AMOUNTS,
  USDT: PRESET_USD_AMOUNTS,
  DAI: PRESET_USD_AMOUNTS,
  JPY: PRESET_JPY_AMOUNTS,
};

const clampAmountIndex = (index: number, max: number) => Math.min(Math.max(index, 0), max);

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

const getPresetEthAmounts = (method: PaymentMethod) => {
  const presets = PRESET_METHOD_AMOUNTS[method] ?? PRESET_METHOD_AMOUNTS.ETH;
  if (method === "ETH") {
    return [...presets];
  }
  return presets.map((value) => convertMethodAmountToEth(value, method));
};

const getEthAmountFromSlider = (index: number, presets: readonly number[]) => {
  const maxIndex = presets.length + VARIABLE_STEPS - 1;
  const clamped = clampAmountIndex(index, maxIndex);
  if (clamped < presets.length) {
    return presets[clamped];
  }
  const extraIndex = clamped - presets.length + 1;
  const base = presets[presets.length - 1];
  return Number((base * Math.pow(1.6, extraIndex)).toFixed(4));
};

const convertEthToMethod = (ethAmount: number, method: PaymentMethod) => {
  switch (method) {
    case "JPY":
      return ethAmount * ETH_TO_JPY;
    case "ETH":
      return ethAmount;
    case "USDC":
    case "USDT":
    case "DAI":
    default:
      return ethAmount * ETH_TO_USD;
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

  const fractionDigits = amount < 10 ? 2 : amount < 100 ? 1 : 0;
  const isWhole = Math.abs(amount - Math.round(amount)) < 1e-6;
  return `${amount.toLocaleString(locale === "ja" ? "en-US" : locale, {
    minimumFractionDigits: isWhole ? 0 : fractionDigits,
    maximumFractionDigits: fractionDigits === 0 ? (isWhole ? 0 : 2) : 2,
  })} ${method}`;
};

const roundToNearest = (value: number, step: number) => Math.round(value / step) * step;

const formatAmountMarkLabel = (ethAmount: number, method: PaymentMethod, locale: string) => {
  if (method === "ETH") {
    const options =
      ethAmount >= 1
        ? { minimumFractionDigits: 0, maximumFractionDigits: 2 }
        : { minimumFractionDigits: 2, maximumFractionDigits: 4 };
    return ethAmount.toLocaleString(locale, options);
  }

  if (method === "JPY") {
    const amountInJpy = convertEthToMethod(ethAmount, method);
    const niceAmount = roundToNearest(amountInJpy, 500);
    return niceAmount.toLocaleString(locale);
  }

  const amountInUsd = convertEthToMethod(ethAmount, method);
  const niceAmount = roundToNearest(amountInUsd, 5);
  return niceAmount.toLocaleString(locale === "ja" ? "en-US" : locale, { maximumFractionDigits: 0 });
};

export default function ContributionPage() {
  const t = useTranslations("contribution");
  const locale = useLocale();
  const router = useRouter();

  // Donation UI state (one-time only, default crypto)
  const [selectedChain, setSelectedChain] = useState<CryptoChain>("ethereum");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("ETH");
  const [amountSliderIndex, setAmountSliderIndex] = useState(1);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [selectedMember, setSelectedMember] = useState<null | { id: string; name: string; role: string; avatar?: string; bio?: string }>(null);
  const [newsMap, setNewsMap] = useState<Record<string, { href: string; external: boolean }>>({});
  const [signClient, setSignClient] = useState<SignClient | null>(null);
  const [walletConnectSession, setWalletConnectSession] = useState<SessionTypes.Struct | null>(null);
  const [walletConnectUri, setWalletConnectUri] = useState<string>("");
  const [walletConnectLoading, setWalletConnectLoading] = useState(false);
  const [walletConnectErrorKey, setWalletConnectErrorKey] = useState<string | null>(null);

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

  const corporateSponsors = [
    { name: "Ethereum Foundation", jpname: "イーサリアム財団", logo: "/sponsors/ef.jpg" },
    { name: "Geodework", jpname: "ジオデワーク", logo: "/sponsors/geodework.jpg" },
    { name: "GuildQB", jpname: "ギルドQB", logo: "/sponsors/guildqb.png" },
    { name: "KIRIFUDA Inc.", jpname: "キリフダ株式会社", logo: "/sponsors/kirifuda.jpg" },
    { name: "DeSci Tokyo", jpname: "デサイ東京", logo: "/sponsors/desci.jpg" },
  ];
  const individualSupporters = [
    { name: "Hiro Shimo", jpname: "志茂 博", logo: "/sponsors/shimo.jpg" },
    { name: "chikeo", jpname: "ちけみーくん", logo: "/sponsors/ticket.jpg" },
    { name: "KIMINORI JAPAN", jpname: "キミノリ・ジャパン", logo: "/sponsors/kiminorijapan.jpg" },
    { name: "Anonymous", jpname: "匿名希望", logo: null },
  ];
  const communityPartners: { name: string; jpname?: string; logo: string | null }[] = [
    // 例: { name: "Community XYZ", jpname: "コミュニティXYZ", logo: null }
  ];

  const supportBulletsRaw = t.raw("supportSection.bullets");
  const supportBullets = Array.isArray(supportBulletsRaw) ? (supportBulletsRaw as string[]) : [];
  const supportBenefitsRaw = t.raw("supportSection.benefits");
  const supportBenefits = Array.isArray(supportBenefitsRaw) ? (supportBenefitsRaw as SupportBenefit[]) : [];
  const supportBenefitsHeading = t("supportSection.benefitsHeading");
  const supportUseCasesHeading = t("supportSection.useCasesHeading");
  const supportersHeading = t("supportersSection.heading");
  const sponsorTitle = t("supportersSection.sponsorTitle");
  const supporterTitle = t("supportersSection.supporterTitle");
  const communityTitle = t("supportersSection.communityTitle");
  const communityComingSoon = t("supportersSection.comingSoon");
  const supportHeading = t("supportSection.heading");
  const supportIntro = t("supportSection.intro");
  const supportTiers = t("supportSection.tiers");
  const supportNote = t("supportSection.note");
  const supportOrganizationsCta = t("supportSection.organizationsCta");
  const supportAmountLabel = t("supportSection.amountLabel");
  const selectionStepLabel = t("supportSection.selectionStep.label");
  const selectionStepTitle = t("supportSection.selectionStep.title");
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
  const faqCorporateAnswer = t.rich("faq.corporateAnswer", {
    contactLink: (chunks) => (
      <Link href="/contact" className="underline underline-offset-2">
        {chunks}
      </Link>
    ),
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

  const recentUpdatesJa = [
    { title: "leanConsensus会議参加", date: "2025年9月6日" },
    { title: "Gethに貢献しました", date: "2025年8月20日" },
    { title: "lean Consensusにおける耐量子署名のスキームを実装しました", date: "2025年8月18日" },
    { title: "コロンビアビジネススクールで論文を発表しました", date: "2025年5月15日" },
    { title: "ZKProof7国際ワークショップにアクセプトされました", date: "2025年8月7日" },
    { title: "ZKProof7国際ワークショップにアクセプトされました", date: "2025年2月11日" },
  ];

  const recentUpdatesEn = [
    { title: "Attended the leanConsensus meeting", date: "2025-09-06" },
    { title: "Contributed to Geth", date: "2025-08-20" },
    { title: "Implemented a post-quantum signature scheme in leanConsensus", date: "2025-08-18" },
    { title: "Presented a paper at Columbia Business School", date: "2025-05-15" },
    { title: "Accepted to the ZKProof7 international workshop", date: "2025-08-07" },
    { title: "Accepted to the ZKProof7 international workshop", date: "2025-02-11" },
  ];

  const faqJa = [
    {
      question: "Nyx Foundationは非営利法人ですか？",
      answer:
        "はい、Nyx Foundationは非営利型の一般社団法人という法人格を有しています。利益分配を目的とせず、剰余金は研究開発・形式検証・コミュニティへの貢献など当団体の目的に再投資されます。",
    },
    {
      question: "寄付金はどのように使われますか？",
      answer:
        "研究開発・形式検証、脆弱性の調査と修正、MEVや制度設計に関する応用研究、運営基盤の維持に充当します。小さなPRや一つの証明でも、長期的に事故防止と信頼性向上につながります。",
    },
    {
      question: "領収書は発行されますか？",
      answer:
        "はい、必要な方に発行します。自動で全ての寄付に発行はしていません。ご希望の方はお問い合わせフォームまたは contact@nyx.foundation までご連絡ください。銀行振込・暗号資産の場合は着金確認後の発行となります。",
    },
    {
      question: "日本円（銀行振込）の方法は？",
      answer:
        "PayPay銀行 かわせみ支店(007) 普通 7551963 ツツミマサト へお振込みください。名義や金額の確認のため、必要に応じてメールでご連絡差し上げます。",
    },
    {
      question: "法人での寄付や協賛は可能ですか？",
      answer: faqCorporateAnswer,
    },
  ];

  const faqEn = [
    {
      question: "Is Nyx Foundation a nonprofit?",
      answer:
        "Yes. Nyx Foundation is a non-profit general incorporated association in Japan. We do not distribute profits; any surplus is reinvested into research, formal verification, and community contributions.",
    },
    {
      question: "How is my donation used?",
      answer:
        "We fund research and formal verification, vulnerability research and fixes, applied work on MEV and mechanism design, and the operational base. Even small PRs and single proofs help prevent incidents over time and raise reliability.",
    },
    {
      question: "Can I get a receipt?",
      answer:
        "Yes, on request. We don’t issue receipts automatically for every donation. If you need one, please contact us via the form or at contact@nyx.foundation. For bank transfers or crypto, we issue after confirming receipt.",
    },
    {
      question: "How do I donate in JPY (bank transfer)?",
      answer:
        "Please transfer to PayPay Bank, Kawasemi branch (007), ordinary 7551963, name: ツツミマサト. We may email you to confirm the payer name and amount if needed.",
    },
    {
      question: "Can companies sponsor or donate?",
      answer: faqCorporateAnswer,
    },
  ];

  const presetEthAmounts = getPresetEthAmounts(selectedMethod);
  const amountSliderMaxIndex = presetEthAmounts.length + VARIABLE_STEPS - 1;
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
  const availableChainValues = availableCryptoChains.map((chain) => chain.value);
  const safeAmountIndex = clampAmountIndex(amountSliderIndex, amountSliderMaxIndex);
  const currentEthAmount = getEthAmountFromSlider(safeAmountIndex, presetEthAmounts);
  const currentAmount = convertEthToMethod(currentEthAmount, selectedMethod);
  const formattedAmount = formatMethodAmount(currentAmount, selectedMethod, locale);
  const paymentSliderValue = paymentOptions.findIndex((opt) => opt.value === selectedMethod);
  const safePaymentSliderValue = paymentSliderValue === -1 ? 0 : paymentSliderValue;
  const chainSliderValue = availableCryptoChains.findIndex((chain) => chain.value === selectedChain);
  const safeChainSliderValue = chainSliderValue === -1 ? 0 : chainSliderValue;

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

  const lastPresetIndex = Math.max(presetEthAmounts.length - 1, 0);
  const presetVisualSpacing = VARIABLE_STEPS + 2; // stretch preset donation marks across most of the track
  const amountSliderPositions = Array.from({ length: amountSliderMaxIndex + 1 }, (_, idx) => {
    if (idx <= lastPresetIndex) {
      return idx * presetVisualSpacing;
    }
    const extraIdx = idx - lastPresetIndex;
    return lastPresetIndex * presetVisualSpacing + extraIdx;
  });
  const amountSliderMaxValue = amountSliderPositions[amountSliderPositions.length - 1] ?? 0;
  const safeAmountSliderValue = amountSliderPositions[safeAmountIndex] ?? 0;

  const findClosestAmountIndex = (sliderValue: number) => {
    let closestIndex = 0;
    let smallestDiff = Number.POSITIVE_INFINITY;
    amountSliderPositions.forEach((position, idx) => {
      const diff = Math.abs(position - sliderValue);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestIndex = idx;
      }
    });
    return closestIndex;
  };

  const handleAmountSliderChange = (sliderValue: number) => {
    setAmountSliderIndex(findClosestAmountIndex(sliderValue));
  };

  const amountMarks = presetEthAmounts.map((eth, index) => ({
    value: amountSliderPositions[index],
    label: formatAmountMarkLabel(eth, selectedMethod, locale),
  }));
  const distributionDataBase = presetEthAmounts.map((eth, idx) => ({
    label: formatMethodAmount(convertEthToMethod(eth, selectedMethod), selectedMethod, locale),
    count: DISTRIBUTION_COUNTS[idx] ?? 0,
  }));
  const distributionData = [
    ...distributionDataBase,
    { label: "", count: DISTRIBUTION_MORE_COUNT },
  ];
  const activeBucketIndex = safeAmountIndex < presetEthAmounts.length ? safeAmountIndex : distributionData.length - 1;
  const activeTickIndex = safeAmountIndex < presetEthAmounts.length ? safeAmountIndex : amountMarks.length - 1;
  const methodMarks = paymentOptions.map((option, idx) => ({ value: idx, label: option.label }));
  const chainMarks = availableCryptoChains.map((chain, idx) => ({ value: idx, label: chain.label }));
  const amountSliderMarks = amountMarks.map((mark, idx) => ({
    ...mark,
    isActive: idx === activeTickIndex,
  }));
  const methodSliderMarks = methodMarks.map((mark, idx) => ({
    ...mark,
    isActive: idx === safePaymentSliderValue,
    onSelect: () => handlePaymentSliderChange(mark.value),
  }));
  const chainSliderMarks = chainMarks.map((mark, idx) => ({
    ...mark,
    isActive: idx === safeChainSliderValue,
    onSelect: () => handleChainSliderChange(idx),
  }));
  const faqs = locale === "ja" ? faqJa : faqEn;

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

  const handleMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
    const nextPresets = getPresetEthAmounts(method);
    const nextMaxIndex = nextPresets.length + VARIABLE_STEPS - 1;
    setAmountSliderIndex((idx) => clampAmountIndex(idx, nextMaxIndex));
  };

  const handlePaymentSliderChange = (index: number) => {
    const option = paymentOptions[index];
    if (option) {
      handleMethodChange(option.value);
    }
  };

  const handleChainSliderChange = (index: number) => {
    const target = availableCryptoChains[index]?.value;
    if (target) {
      setSelectedChain(target);
    }
  };

  const getDisplayAmount = () => formattedAmount;

  const toggleFAQ = (idx: number) => setOpenFAQ(openFAQ === idx ? null : idx);

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
            chain: availableCryptoChains[safeChainSliderValue]?.label ?? "",
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
    safeChainSliderValue,
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
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              {locale === "ja" ? (
                <span className="whitespace-nowrap">NyxはEthereumを信頼できる社会基盤に。</span>
              ) : (
                <>Nyx makes Ethereum a trustworthy social infrastructure.</>
              )}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {locale === "ja" ? (
                <>
                  我々はビジョン主導の非営利法人です。<span className="font-semibold">「オープンイノベーションのための検証可能な未来を築く」</span>を掲げ、分散システムや暗号技術の研究開発に取り組んでいます。寄付を通じて我々の活動を支援することができます。
                </>
              ) : (
                <>
                  Under the vision <span className="font-semibold">“Build a verifiable future for open innovation”</span>, we research and develop distributed systems and cryptography. You can support our work with a one‑time donation of any amount.
                </>
              )}
            </p>
            {/* サブスク文言は削除（今回のみの寄付に統一） */}
          </div>
        </section>

        {/* Story - Part 1: 信頼できる社会基盤としてのEthereum */}
        <section className="bg-muted/50 rounded-2xl p-12 md:p-14 mb-28 md:mb-36">
          {locale === "ja" ? (
            <div className="max-w-6xl mx-auto space-y-12 md:space-y-14">
              <h2 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">信頼できる社会基盤としてのEthereum</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-7 md:gap-9 items-center">
                <div className="order-2 md:order-2 lg:col-span-7 self-center space-y-4 text-[15px] md:text-base text-muted-foreground leading-relaxed">
                  <p>仕様と実装が整合し、状態遷移と資産移転が期待どおりに一貫して実行され、第三者が検証できる——それが「信頼できる社会基盤」としての条件です。</p>
                  <p>この基盤の上で動くスマートコントラクトは、信頼を特定の主体に預けず、約束をコード化し、履行まで検証可能にします。だからこそ、過剰な仲介は最小化され、市場支配が生む非効率は抑えられ、参入障壁は下がる。結果として、世界中の誰もが、公平なルールの上で新しい価値を試し、組み合わせ、広げていける——私たちはそのための社会基盤づくりに貢献します。</p>
                </div>
                <div className="order-1 md:order-1 lg:col-span-5">
                  <div className="relative w-full aspect-[16/9] md:aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-sm">
                    <Image
                      src="/ethereum-community.png"
                      alt="信頼できる社会基盤としてのEthereumのビジュアル"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 320px, 400px"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-12 md:space-y-14">
              <h2 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">Ethereum as trustworthy social infrastructure</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-7 md:gap-9 items-center">
                <div className="order-2 md:order-2 lg:col-span-7 self-center space-y-4 text-[15px] md:text-base text-muted-foreground leading-relaxed">
                  <p>Alignment between specs and implementations, predictable state transitions and value transfers, and third‑party verifiability—these are the conditions for a trustworthy social infrastructure.</p>
                  <p>On such a foundation, smart contracts don’t rely on specific intermediaries: they codify promises and keep them verifiably. Excessive intermediation shrinks, inefficiencies from market dominance are curbed, and barriers to entry drop. As a result, anyone, anywhere can experiment, compose, and scale new value under fair rules—and we contribute to building that foundation.</p>
                </div>
                <div className="order-1 md:order-1 lg:col-span-5">
                  <div className="relative w-full aspect-[16/9] md:aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-sm">
                    <Image
                      src="/ethereum-community.png"
                      alt="Ethereum as trustworthy social infrastructure"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 320px, 400px"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

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
                <button onClick={() => setSelectedMember(null)} className="text-sm text-muted-foreground hover:text-foreground">{locale === "ja" ? "閉じる" : "Close"}</button>
              </div>
              <div className="p-5">
                <p className="text-sm leading-relaxed text-foreground/80">{selectedMember.bio || (locale === "ja" ? "プロフィール情報は準備中です。" : "Profile information is coming soon.")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Roadmap: 何をするか（タイトルのみ変更） */}
        <section className="bg-muted/50 rounded-2xl p-12 md:p-14 mb-28 md:mb-36">
          {locale === "ja" ? (
            <div className="max-w-6xl mx-auto space-y-12 md:space-y-14">
              <h3 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">私たちの3つの柱</h3>

              {/* Stepper */}
              <div className="relative">
                <div className="absolute left-0 right-0 top-[7px] h-[2px] bg-gray-200" />
                <ol className="relative z-10 grid grid-cols-3 gap-4">
                  {[
                    { label: "安全にする", desc: "", color: "bg-emerald-500" },
                    { label: "使いやすくする", desc: "", color: "bg-amber-500" },
                    { label: "広げる", desc: "", color: "bg-sky-500" },
                  ].map((s) => (
                    <li key={s.label} className="flex flex-col items-center text-center">
                      <span className={`w-3.5 h-3.5 rounded-full ring-4 ring-white ${s.color}`} />
                      <span className="mt-2 text-sm font-medium">{s.label}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Phase Cards */}
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-md bg-emerald-50 text-emerald-700"><ShieldCheck className="w-5 h-5" /></div>
                    <h4 className="font-semibold">安全にする</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">仕様と実装の一致を前提に</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>クライアントのバグ修正・性能最適化</li>
                    <li>leanConsensusやzkVMの研究開発</li>
                    <li>検証自動化ツールの開発</li>
                  </ul>
                </div>
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-md bg-amber-50 text-amber-700"><FunctionSquare className="w-5 h-5" /></div>
                    <h4 className="font-semibold">使いやすくする</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">アプリケーションの体験と効率を高める</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>DeFiのバグ報告及び性能改善</li>
                    <li>MEVを最適化する研究とその実装</li>
                    <li>新規アプリケーションの開発</li>
                  </ul>
                </div>
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-md bg-sky-50 text-sky-700"><Lightbulb className="w-5 h-5" /></div>
                    <h4 className="font-semibold whitespace-nowrap">広げる</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">学術と産業をオープンに橋渡しする</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Research Houseの運営</li>
                    <li>教育プログラムの実施</li>
                    <li>Ethereumの制度的応用研究</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-10">
              <h3 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">Our Three Pillars</h3>

              <div className="relative">
                <div className="absolute left-0 right-0 top-[7px] h-[2px] bg-gray-200" />
                <ol className="relative z-10 grid grid-cols-3 gap-4">
                  {[
                    { label: "Secure", desc: "", color: "bg-emerald-500" },
                    { label: "Make usable", desc: "", color: "bg-amber-500" },
                    { label: "Expand", desc: "", color: "bg-sky-500" },
                  ].map((s) => (
                    <li key={s.label} className="flex flex-col items-center text-center">
                      <span className={`w-3.5 h-3.5 rounded-full ring-4 ring-white ${s.color}`} />
                      <span className="mt-2 text-sm font-medium">{s.label}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-md bg-emerald-50 text-emerald-700"><ShieldCheck className="w-5 h-5" /></div>
                    <h4 className="font-semibold">Secure</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Assumes spec–implementation alignment</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Bug fixes and performance optimization for clients</li>
                    <li>R&D on leanConsensus and zkVM</li>
                    <li>Build automated verification tools</li>
                  </ul>
                </div>
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-md bg-amber-50 text-amber-700"><FunctionSquare className="w-5 h-5" /></div>
                    <h4 className="font-semibold">Make usable</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Improve application experience and efficiency</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Report DeFi bugs and improve performance</li>
                    <li>Research and implement MEV optimization</li>
                    <li>Develop new applications</li>
                  </ul>
                </div>
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-md bg-sky-50 text-sky-700"><Lightbulb className="w-5 h-5" /></div>
                    <h4 className="font-semibold whitespace-nowrap">Expand</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Bridge academia and industry openly</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Operate the Research House</li>
                    <li>Run education programs</li>
                    <li>Research institutional applications of Ethereum</li>
                  </ul>
                </div>
              </div>

              {/* Removed quarterly roadmap note per request */}
            </div>
          )}
        </section>

        {/* Team & Achievements section */}
        <section className="bg-muted/50 rounded-2xl p-12 md:p-14 mb-28 md:mb-36">
          {locale === "ja" ? (
            <div className="max-w-6xl mx-auto space-y-12 md:space-y-14">
              <h3 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">チームと実績</h3>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <h4 className="font-semibold mb-3">チーム</h4>
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
                  <h4 className="font-semibold mb-3">実績</h4>
                  <div className="space-y-2">
                    {recentUpdatesJa.slice(0,5).map((u, i) => {
                      const m = newsMap[u.title];
                      const href = m?.href || "/news";
                      const isExternal = m?.external;
                      return (
                        <div key={i} className="py-2 border-b last:border-b-0">
                          {isExternal ? (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                              {u.title}
                            </a>
                          ) : (
                            <Link href={href} className="text-sm font-medium hover:underline">
                              {u.title}
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4">
                    <Link href="/news" className="inline-flex items-center h-10 px-4 border border-border rounded-md hover:bg-muted/50">
                      もっと見る
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-10 md:space-y-12">
              <h3 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">Team & Achievements</h3>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <h4 className="font-semibold mb-2">Team</h4>
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
                  <h4 className="font-semibold mb-2">Achievements</h4>
                  <div className="space-y-2">
                    {recentUpdatesEn.slice(0,5).map((u, i) => {
                      const m = newsMap[u.title];
                      const href = m?.href || "/news";
                      const isExternal = m?.external;
                      return (
                        <div key={i} className="py-2 border-b last:border-b-0">
                          {isExternal ? (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                              {u.title}
                            </a>
                          ) : (
                            <Link href={href} className="text-sm font-medium hover:underline">
                              {u.title}
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4">
                    <Link href="/news" className="inline-flex items-center h-10 px-4 border border-border rounded-md hover:bg-muted/50">
                      View more
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Story - Part 2: 私たちがやる理由 */}
        <section className="bg-muted/50 rounded-2xl p-12 md:p-14 mb-28 md:mb-36">
          {locale === "ja" ? (
            <div className="max-w-6xl mx-auto space-y-8 md:space-y-10">
              <h3 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">私たちがやる理由</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-7 md:gap-9 items-center">
                <div className="order-1 md:order-1 lg:col-span-7 self-center space-y-3 text-base text-muted-foreground leading-relaxed">
                  <p>Ethereum は、学歴・人種・年齢・所属にかかわらず、行為と成果で評価される場です。オープンな議論とピアレビュー、公開された実装と検証、そして誰もが参加できる開発プロセス――この世界観に強く惹かれた少人数の若手中心チームが私たちです。</p>
                  <p>境界の少ないフィールドで、良い研究と実装、確かな検証を積み重ねる。その営みが、ユーザーと開発者、社会に利益をもたらすと信じています。</p>
                </div>
                <div className="order-2 md:order-2 lg:col-span-5">
                  <div className="relative w-full aspect-[16/9] md:aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-sm">
                    <Image
                      src="/gallery/activities-hero.jpg"
                      alt="私たちの活動の様子"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 320px, 400px"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
              {/* Team & Achievements moved to its own section above */}
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8 md:space-y-10">
              <h3 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">Why we do this</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-7 md:gap-9 items-center">
                <div className="order-2 md:order-1 lg:col-span-7 self-center space-y-4 text-[15px] md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    Ethereum is a meritocratic arena where background—education, ethnicity, age, affiliation—matters less than proven skill and outcomes. Open discussion and review, public implementations, and permissionless contribution define the culture. We are a small, young team drawn to that ethos, focused on better implementations and sound verification for the benefit of both users and developers.
                  </p>
                </div>
                <div className="order-1 md:order-2 lg:col-span-5">
                  <div className="relative w-full aspect-[16/9] md:aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-sm">
                    <Image
                      src="/gallery/activities-hero.jpg"
                      alt="Our team and work"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 320px, 400px"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
              {/* Team & Achievements moved to its own section above */}
            </div>
          )}
        </section>

        {/* Story - Part 3: Sponsor / Supporterについて */}
        {false && (
        <section className="bg-muted/50 rounded-2xl p-12 md:p-14 mb-28 md:mb-36">
          {locale === "ja" ? (
            <div className="max-w-6xl mx-auto space-y-10 md:space-y-12">
              <div className="max-w-6xl mx-auto space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">スポンサー / サポーターについて</h3>
                <p className="text-base text-muted-foreground leading-relaxed">Nyx Foundationの価値観に共感し、Nyxの活動を前に進めるお手伝いをしてくださる方々をスポンサー / サポーターと呼んでいます。スポンサー / サポーターからのご支援は、「検証が前提」のエコシステムと、公平なルールの上で価値が広がる世界への一歩になります。</p>
              </div>
              {/* 返礼品をこのコンテナ内に配置（重複を避け、この場だけで表示） */}
              <div className="max-w-6xl mx-auto">
                <div className="grid sm:grid-cols-2 gap-6 md:gap-7 place-items-stretch">
                  <div className="w-full rounded-xl p-6 bg-white/90 shadow-sm ring-1 ring-gray-100 text-center hover:shadow-md transition-shadow space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-2 rounded-md bg-blue-50 text-blue-700"><Globe className="w-6 h-6" /></div>
                      <h5 className="font-semibold">webページへのロゴ掲載</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">公式サイトのスポンサー欄に掲載</p>
                  </div>
                  <div className="w-full rounded-xl p-6 bg-white/90 shadow-sm ring-1 ring-gray-100 text-center hover:shadow-md transition-shadow space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-2 rounded-md bg-purple-50 text-purple-700"><Shirt className="w-6 h-6" /></div>
                      <h5 className="font-semibold">オリジナルグッズ配送</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">Tシャツやステッカーなど</p>
                  </div>
                  <div className="w-full rounded-xl p-6 bg-white/90 shadow-sm ring-1 ring-gray-100 text-center hover:shadow-md transition-shadow space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-2 rounded-md bg-emerald-50 text-emerald-700"><Calendar className="w-6 h-6" /></div>
                      <h5 className="font-semibold">イベント参加権</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">カンファレンス・勉強会への優先参加</p>
                  </div>
                  <div className="w-full rounded-xl p-6 bg-white/90 shadow-sm ring-1 ring-gray-100 text-center hover:shadow-md transition-shadow space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-2 rounded-md bg-amber-50 text-amber-700"><BadgeCheck className="w-6 h-6" /></div>
                      <h5 className="font-semibold">スポンサー / サポーター称号・バッジの使用</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">プロフィール/発表資料等で「スポンサー / サポーター」を名乗れます</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="max-w-6xl mx-auto space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">About Sponsor / Supporter</h3>
                <p className="text-base text-muted-foreground leading-relaxed">We call those who share Nyx Foundation’s values and help move our work forward the Sponsor / Supporter community. Support from Sponsor / Supporter is a step toward a verification-first ecosystem and a world where value grows on fair rules.</p>
              </div>
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-6">
                  <h4 className="text-lg font-semibold">Benefits</h4>
                  <p className="text-sm text-muted-foreground">As a thank-you for your support:</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-6 md:gap-7 place-items-stretch">
                  <div className="w-full rounded-xl p-6 bg-white/90 shadow-sm ring-1 ring-gray-100 text-center hover:shadow-md transition-shadow space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-2 rounded-md bg-blue-50 text-blue-700"><Globe className="w-6 h-6" /></div>
                      <h5 className="font-semibold">Logo placement</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">On our website sponsor section</p>
                  </div>
                  <div className="w-full rounded-xl p-6 bg-white/90 shadow-sm ring-1 ring-gray-100 text-center hover:shadow-md transition-shadow space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-2 rounded-md bg-purple-50 text-purple-700"><Shirt className="w-6 h-6" /></div>
                      <h5 className="font-semibold">Original goods</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">T-shirts, stickers, and more</p>
                  </div>
                  <div className="w-full rounded-xl p-6 bg-white/90 shadow-sm ring-1 ring-gray-100 text-center hover:shadow-md transition-shadow space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-2 rounded-md bg-emerald-50 text-emerald-700"><Calendar className="w-6 h-6" /></div>
                      <h5 className="font-semibold">Event access</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">Priority for conferences and meetups</p>
                  </div>
                  <div className="w-full rounded-xl p-6 bg-white/90 shadow-sm ring-1 ring-gray-100 text-center hover:shadow-md transition-shadow space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-2 rounded-md bg-amber-50 text-amber-700"><BadgeCheck className="w-6 h-6" /></div>
                      <h5 className="font-semibold">Sponsor / Supporter badge</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">Use “Sponsor / Supporter” on profiles and slides</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
        )}

        {/* Impact section removed; merged conceptually into reasons */}

        {/* 寄付方法＆ツイート セクションは削除（要望） */}

        {/* Achievements section removed as requested */}

        {/* Benefits section moved into “ご支援の使い道” */}

        {/* Sponsors & Supporters（グリッド、非スクロール、ロゴ貼り付け） */}
        <section className="mb-28 md:mb-36">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold whitespace-nowrap">{supportersHeading}</h2>
            </div>
            {/* 法人・個人メイトを単一コンテナに統合 */}
            <div className="rounded-xl p-12 md:p-14 bg-white shadow-sm ring-1 ring-gray-100">
              <div className="grid grid-cols-1 gap-12 md:gap-14">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold mb-8">{sponsorTitle}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
                  {corporateSponsors.map((c) => (
                    <div key={c.name} className="flex flex-col items-center gap-3">
                      <div className="relative w-16 h-16 md:w-16 md:h-16">
                        {c.logo ? (
                          <Image src={c.logo} alt={c.name} fill className="object-cover rounded-full ring-1 ring-gray-200" />
                        ) : (
                          <div className="w-full h-full bg-muted rounded-full ring-1 ring-gray-200" />
                        )}
                      </div>
                      <div className="text-xs md:text-sm text-center text-foreground/80">
                        {locale === "ja"
                          ? (c.name === "KIRIFUDA Inc." ? c.jpname : c.name)
                          : c.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-8">{supporterTitle}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
                  {individualSupporters.map((c) => (
                    <div key={c.name} className="flex flex-col items-center gap-3">
                      <div className="relative w-16 h-16 md:w-16 md:h-16">
                        {c.logo ? (
                          <Image src={c.logo} alt={c.name} fill className="object-cover rounded-full ring-1 ring-gray-200" />
                        ) : (
                          <div className="w-full h-full bg-muted rounded-full ring-1 ring-gray-200 flex items-center justify-center">
                            <HelpCircle className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs md:text-sm text-center text-foreground/80">
                        {locale === "ja"
                          ? (c.name === "Hiro Shimo" || c.name === "KIMINORI JAPAN" ? c.name : c.jpname)
                          : c.name}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Community Partners */}
                <div className="mt-12">
                  <h3 className="text-xl md:text-2xl font-bold mb-8">{communityTitle}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
                    {communityPartners.length === 0 ? (
                      <p className="col-span-full text-center text-sm text-muted-foreground">{communityComingSoon}</p>
                    ) : (
                      communityPartners.map((c) => (
                        <div key={c.name} className="flex flex-col items-center gap-3">
                          <div className="relative w-16 h-16 md:w-16 md:h-16">
                            {c.logo ? (
                              <Image src={c.logo} alt={c.name} fill className="object-cover rounded-full ring-1 ring-gray-200" />
                            ) : (
                              <div className="w-full h-full bg-muted rounded-full ring-1 ring-gray-200 flex items-center justify-center" />
                            )}
                          </div>
                          <div className="text-xs md:text-sm text-center text-foreground/80">
                            {locale === "ja" ? (c.jpname ?? c.name) : c.name}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </section>

        {/* 寄付者の声 セクションは削除（要望） */}

        {/* Research Partnership section removed */}

        {/* Support Nyx section (donation card relocated here) */}
        <section className="mb-28 md:mb-36">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.05fr),minmax(0,1fr)] lg:items-start">
            <div className="space-y-8 md:space-y-10 text-left">
              <div className="space-y-3 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold">{supportHeading}</h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{supportIntro}</p>
                <p className="text-sm text-muted-foreground">{supportTiers}</p>
              </div>

              {supportBullets.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
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

              {supportBenefits.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    {supportBenefitsHeading}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {supportBenefits.map((benefit) => (
                      <div
                        key={benefit.title}
                        className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
                      >
                        <Sparkles className="h-5 w-5 shrink-0 text-emerald-600" />
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-emerald-900">{benefit.title}</div>
                          <p className="text-sm text-emerald-800">{benefit.description}</p>
                        </div>
                      </div>
                    ))}
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
            <div className="relative z-10 rounded-xl p-6 md:p-8 bg-white shadow-sm ring-1 ring-gray-100">
              <div className="grid grid-cols-1 gap-6 md:gap-7 md:grid-cols-2 lg:gap-8 lg:grid-cols-[1.15fr,1fr]">
                <div className="border border-border rounded-lg bg-muted/10 p-5 md:p-6 space-y-5 md:space-y-6">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{selectionStepLabel}</div>
                    <h3 className="text-sm font-semibold text-foreground mt-1">{selectionStepTitle}</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{supportMethodLabel}</span>
                      <span>{paymentOptions[safePaymentSliderValue]?.label ?? ""}</span>
                    </div>
                    <div className="px-4 md:px-6">
                      <SliderWithMarks
                        min={0}
                        max={Math.max(paymentOptions.length - 1, 0)}
                        value={safePaymentSliderValue}
                        onChange={handlePaymentSliderChange}
                        marks={methodSliderMarks}
                        ariaLabel={supportMethodLabel}
                        ariaValueText={paymentOptions[safePaymentSliderValue]?.label ?? undefined}
                      />
                    </div>
                  </div>

                  {!isFiatJPY && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>{supportChainLabel}</span>
                        <span>{availableCryptoChains[safeChainSliderValue]?.label ?? ""}</span>
                      </div>
                      <div className="px-4 md:px-6">
                        <SliderWithMarks
                          min={0}
                          max={Math.max(availableCryptoChains.length - 1, 0)}
                          value={safeChainSliderValue}
                          onChange={handleChainSliderChange}
                          marks={chainSliderMarks}
                          ariaLabel={supportChainLabel}
                          ariaValueText={availableCryptoChains[safeChainSliderValue]?.label ?? undefined}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{supportAmountLabel}</span>
                      <span>{formattedAmount}</span>
                    </div>
                    <SupportDistributionChart
                      data={distributionData}
                      activeIndex={activeBucketIndex}
                      peopleSuffix={distributionPeopleSuffix}
                      hideLabels
                    />
                    <div className="px-4 md:px-6">
                      <SliderWithMarks
                        min={0}
                        max={amountSliderMaxValue}
                        value={safeAmountSliderValue}
                        onChange={handleAmountSliderChange}
                        marks={amountSliderMarks}
                        ariaLabel={supportAmountLabel}
                        ariaValueText={formattedAmount}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 md:space-y-7">
                  <div className="border border-border rounded-lg bg-muted/10 p-5 md:p-6 space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{stepOneLabel}</div>
                        <h3 className="text-sm font-semibold text-foreground mt-1">{stepOneTitle}</h3>
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
                            <RefreshCcw className="w-3 h-3" /> {t("supportSection.wcReset")}
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
                                style={{ height: "168px", width: "168px" }}
                              />
                            </div>
                          </div>
                        )}
                        {!walletConnectUri && walletConnectLoading && (
                          <p className="text-xs text-muted-foreground">{t("supportSection.wcWaiting")}</p>
                        )}
                        {walletConnectSession && (
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{t("supportSection.wcConnected")}</span>
                              <span className="font-mono text-foreground/90">
                                {shortenAddress(walletConnectAddressForTarget ?? walletConnectPrimaryAddress ?? "") || "—"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{supportChainLabel}</span>
                              <span>{availableCryptoChains[safeChainSliderValue]?.label ?? ""}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{supportAmountLabel}</span>
                              <span>{formattedAmount}</span>
                            </div>
                            {!walletConnectSupportsTargetChain && (
                              <p className="text-amber-600">
                                {t("supportSection.wcSwitchHint", {
                                  chain: availableCryptoChains[safeChainSliderValue]?.label ?? "",
                                })}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      !isFiatJPY && (
                        <div className="rounded-lg border border-dashed border-border bg-white/50 p-4 text-xs text-muted-foreground">
                          {t("supportSection.wcDisabled")}
                        </div>
                      )
                    )}
                  </div>

                  <div className="border border-border rounded-lg bg-muted/10 p-5 md:p-6 space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{stepTwoLabel}</div>
                        <h3 className="text-sm font-semibold text-foreground mt-1">{stepTwoTitle}</h3>
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
                      <p className="text-xs text-amber-600">{t("supportSection.wcConnectPrompt")}</p>
                    )}
                    {isFiatJPY && (
                      <div className="rounded-lg border border-border bg-white/80 p-4 space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">PayPay銀行</span>
                          <button onClick={() => copyToClipboard("PayPay銀行")} className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-xs">
                            <Copy className="w-3 h-3" /> {locale === "ja" ? "コピー" : "Copy"}
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>かわせみ支店(007) 普通</span>
                          <button onClick={() => copyToClipboard("007")} className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-xs">
                            <Copy className="w-3 h-3" /> {locale === "ja" ? "コピー" : "Copy"}
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>7551963 ツツミマサト</span>
                          <button onClick={() => copyToClipboard("7551963")} className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-xs">
                            <Copy className="w-3 h-3" /> {locale === "ja" ? "コピー" : "Copy"}
                          </button>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handlePayment}
                      disabled={!canSendDonation}
                      className="relative z-10 w-full h-12 bg-gray-700 text-white rounded-md font-medium shadow-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                      <Heart className="w-4 h-4" /> {donateButtonLabel}{" "}{getDisplayAmount()}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-28 md:mb-36">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-14">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 whitespace-nowrap">{locale === "ja" ? "よくある質問" : "FAQ"}</h2>
              <p className="text-muted-foreground">{locale === "ja" ? "寄付に関するご質問にお答えします" : "Answers to common donation questions"}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 md:gap-10">
              {faqs.map((faq, idx) => (
                <div key={idx} className="rounded-md bg-white/90 shadow-sm ring-1 ring-gray-100">
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
              <p className="text-muted-foreground">
                {locale === "ja" ? (
                  <>その他のご質問がございましたら、お気軽に <Link href="/contact" className="underline">お問い合わせ</Link> ください。</>
                ) : (
                  <>For other questions, feel free to <Link href="/contact" className="underline">contact us</Link>.</>
                )}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
