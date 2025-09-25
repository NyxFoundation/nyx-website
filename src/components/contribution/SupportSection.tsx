'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import SignClient from "@walletconnect/sign-client";
import type { SignClientTypes, SessionTypes } from "@walletconnect/types";
import { BadgeCheck, CheckCircle2, Circle, Copy, Heart, RefreshCcw, Users, X } from "lucide-react";

import {
  CHAIN_ID_MAP,
  CORPORATE_SPONSORS,
  DEFAULT_GAS_HEX,
  DONATION_ADDRESS,
  ERC20_METADATA,
  FIXED_AMOUNTS,
  INDIVIDUAL_SUPPORTERS,
  SUPPORT_TIER_ETH_AMOUNTS,
  TIER_AMOUNT_BADGES,
  TOKEN_TRANSFER_GAS_HEX,
  WALLETCONNECT_EVENTS,
  WALLETCONNECT_METADATA,
  WALLETCONNECT_METHODS,
  WALLETCONNECT_RELAY_URL,
} from "@/app/contribution/constants";
import {
  convertMethodAmountToEth,
  encodeErc20Transfer,
  formatMethodAmount,
  isUserRejectedRequest,
  shortenAddress,
  toBaseUnits,
  toHexChainId,
  toHexWei,
} from "@/app/contribution/logic";
import type { CryptoChain, PaymentMethod, SponsorInfo, TokenPaymentMethod } from "@/app/contribution/types";
import { SupportTierButton, type SupportBenefit } from "./SupportTierButton";
import { DonorAvatar, getLocalizedSponsorName } from "./DonorAvatar";

type PaymentOption = { value: PaymentMethod; label: string; type: "crypto" | "fiat" };

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

const ContributionSupportSection = () => {
  const t = useTranslations("contribution");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const donationCardRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const [selectedChain, setSelectedChain] = useState<CryptoChain>("ethereum");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("ETH");
  const [selectedAmountIndex, setSelectedAmountIndex] = useState(0);
  const [signClient, setSignClient] = useState<SignClient | null>(null);
  const [walletConnectSession, setWalletConnectSession] = useState<SessionTypes.Struct | null>(null);
  const [walletConnectUri, setWalletConnectUri] = useState<string>("");
  const [walletConnectLoading, setWalletConnectLoading] = useState(false);
  const [walletConnectErrorKey, setWalletConnectErrorKey] = useState<string | null>(null);
  const [isDonationOverlayOpen, setDonationOverlayOpen] = useState(false);
  const [activeTier, setActiveTier] = useState<keyof typeof SUPPORT_TIER_ETH_AMOUNTS | null>(null);

  const corporateSplitIndex = Math.ceil(CORPORATE_SPONSORS.length / 2);
  const premiumTierDonors = useMemo(() => CORPORATE_SPONSORS.slice(0, corporateSplitIndex), [corporateSplitIndex]);
  const sponsorTierDonors = useMemo(() => {
    const remainder = CORPORATE_SPONSORS.slice(corporateSplitIndex);
    return remainder.length > 0 ? remainder : CORPORATE_SPONSORS;
  }, [corporateSplitIndex]);
  const supporterTierDonors = useMemo(() => INDIVIDUAL_SUPPORTERS, []);
  const tierDonors = useMemo<Record<keyof typeof SUPPORT_TIER_ETH_AMOUNTS, SponsorInfo[]>>(
    () => ({
      premium: premiumTierDonors,
      sponsor: sponsorTierDonors,
      supporter: supporterTierDonors,
    }),
    [premiumTierDonors, sponsorTierDonors, supporterTierDonors]
  );
  const tierAvatarRings = useMemo<Record<keyof typeof SUPPORT_TIER_ETH_AMOUNTS, string>>(
    () => ({
      premium: "ring-2 ring-fuchsia-200/80 shadow-md",
      sponsor: "ring-2 ring-emerald-200/80 shadow-md",
      supporter: "ring-2 ring-emerald-300/80 shadow-md",
    }),
    []
  );
  const tierDonorNames = useMemo<Record<keyof typeof SUPPORT_TIER_ETH_AMOUNTS, string>>(
    () => ({
      premium: premiumTierDonors.map((entry) => getLocalizedSponsorName(entry, locale)).join(", "),
      sponsor: sponsorTierDonors.map((entry) => getLocalizedSponsorName(entry, locale)).join(", "),
      supporter: supporterTierDonors.map((entry) => getLocalizedSponsorName(entry, locale)).join(", "),
    }),
    [locale, premiumTierDonors, sponsorTierDonors, supporterTierDonors]
  );
  const donorPreviewLabels = useMemo<Record<keyof typeof SUPPORT_TIER_ETH_AMOUNTS, string | null>>(
    () => ({
      premium:
        tierDonorNames.premium && tierDonors.premium.length > 0
          ? t("supportSection.donorPreviewLabel", {
              count: tierDonors.premium.length,
              names: tierDonorNames.premium,
            })
          : null,
      sponsor:
        tierDonorNames.sponsor && tierDonors.sponsor.length > 0
          ? t("supportSection.donorPreviewLabel", {
              count: tierDonors.sponsor.length,
              names: tierDonorNames.sponsor,
            })
          : null,
      supporter:
        tierDonorNames.supporter && tierDonors.supporter.length > 0
          ? t("supportSection.donorPreviewLabel", {
              count: tierDonors.supporter.length,
              names: tierDonorNames.supporter,
            })
          : null,
    }),
    [t, tierDonorNames, tierDonors]
  );

  const paymentOptions: PaymentOption[] = [
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
  const supportHeading = t("supportSection.heading");
  const supportIntro = t("supportSection.intro");
  const supportTiers = t("supportSection.tiers");
  const supportNote = t("supportSection.note");
  const supportUseCasesHeading = t("supportSection.useCasesHeading");
  const supportOrganizationsCta = t("supportSection.organizationsCta");
  const copyLabel = tCommon("copy");
  const supportAmountLabel = t("supportSection.amountLabel");
  const supportMethodLabel = t("supportSection.methodLabel");
  const supportChainLabel = t("supportSection.chainLabel");
  const selectionStepLabel = t("supportSection.selectionStep.label");
  const selectionStepTitle = t("supportSection.selectionStep.title");
  const selectionStepDescription = t("supportSection.selectionStep.description");
  const stepOneLabel = t("supportSection.steps.step1.label");
  const stepOneTitle = t("supportSection.steps.step1.title");
  const stepOneDescription = t("supportSection.steps.step1.description");
  const stepOneFiatDescription = t("supportSection.steps.step1.fiatDescription");
  const stepTwoLabel = t("supportSection.steps.step2.label");
  const stepTwoTitle = t("supportSection.steps.step2.title");
  const stepTwoDescription = t("supportSection.steps.step2.description");
  const stepTwoFiatDescription = t("supportSection.steps.step2.fiatDescription");
  const stepStatusPending = t("supportSection.steps.status.pending");
  const stepStatusComplete = t("supportSection.steps.status.complete");
  const stepStatusAction = t("supportSection.steps.status.action");
  const stepStatusReady = t("supportSection.steps.status.ready");
  const stepStatusSkipped = t("supportSection.steps.status.skipped");
  const supportDonateCta = t("supportSection.donateCta");
  const supportCompleteCta = t("supportSection.completeCta");
  const closeOverlayAria = t("supportSection.closeOverlayAria");
  const bankNameLabel = t("howToDonate.bankTransfer.bankName");
  const branchNameLabel = t("howToDonate.bankTransfer.branchName");
  const accountNumberLabel = t("howToDonate.bankTransfer.accountNumber");
  const accountNameLabel = t("howToDonate.bankTransfer.accountName");
  const walletConnectFallbackNote = t.rich("supportSection.wcFallbackNote", {
    contactLink: (chunks) => (
      <Link href="/contact" className="underline underline-offset-2">
        {chunks}
      </Link>
    ),
    address: (chunks) => <span className="font-mono break-all text-foreground/80">{chunks}</span>,
  });

  const tierHeadingByKey: Record<keyof typeof SUPPORT_TIER_ETH_AMOUNTS, string> = {
    premium: premiumBenefitsHeading,
    sponsor: sponsorBenefitsHeading,
    supporter: supporterBenefitsHeading,
  };
  const activeTierHeading = activeTier ? tierHeadingByKey[activeTier] : null;
  const activeTierBadge = activeTier ? TIER_AMOUNT_BADGES[activeTier] : null;
  const activeTierDonors = activeTier ? tierDonors[activeTier] ?? [] : [];
  const activeTierAvatarRing = activeTier ? tierAvatarRings[activeTier] : "ring-2 ring-emerald-100/80 shadow-sm";
  const donorListTitle = activeTier ? t("supportSection.donorListTitle", { count: activeTierDonors.length }) : null;
  const donorListEmptyMessage = t("supportSection.donorListEmpty");

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

  const walletConnectAccountForTarget = useMemo(
    () => walletConnectAccounts.find((account) => account.startsWith(`${targetNamespace}:`)) ?? null,
    [walletConnectAccounts, targetNamespace]
  );

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
  }, [signClient]);

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
  }, [signClient, isWalletConnectEligible, walletConnectLoading, walletConnectSession, targetNamespace]);

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
    walletConnectSession,
  ]);

  const getDisplayAmount = () => formattedAmount;

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    <>
      <section id="support-nyx" className="mb-28 md:mb-36">
        <div className="mx-auto max-w-6xl space-y-10 text-left">
          <div className="space-y-3 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold">{supportHeading}</h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{supportIntro}</p>
          </div>

          {supportBullets.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em]">{supportUseCasesHeading}</h3>
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
                    donors={tierDonors.premium}
                    donorNames={tierDonorNames.premium}
                    donorPreviewLabel={donorPreviewLabels.premium ?? undefined}
                    locale={locale}
                  />
                )}
                {sponsorBenefits.length > 0 && (
                  <SupportTierButton
                    variant="sponsor"
                    heading={sponsorBenefitsHeading}
                    badgeLabel={TIER_AMOUNT_BADGES.sponsor}
                    benefits={sponsorBenefits}
                    onClick={() => handleTierClick("sponsor")}
                    donors={tierDonors.sponsor}
                    donorNames={tierDonorNames.sponsor}
                    donorPreviewLabel={donorPreviewLabels.sponsor ?? undefined}
                    locale={locale}
                  />
                )}
                {supporterBenefits.length > 0 && (
                  <SupportTierButton
                    variant="supporter"
                    heading={supporterBenefitsHeading}
                    badgeLabel={TIER_AMOUNT_BADGES.supporter}
                    benefits={supporterBenefits}
                    onClick={() => handleTierClick("supporter")}
                    donors={tierDonors.supporter}
                    donorNames={tierDonorNames.supporter}
                    donorPreviewLabel={donorPreviewLabels.supporter ?? undefined}
                    locale={locale}
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
              {activeTier !== null && (
                <div className="mb-6 rounded-lg border border-emerald-100/80 bg-emerald-50/70 p-4">
                  {donorListTitle && <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900/80">{donorListTitle}</div>}
                      {activeTierDonors.length > 0 ? (
                        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {activeTierDonors.map((donor, index) => (
                            <li
                              key={`${donor.names.default}-${index}`}
                              className="flex items-center gap-3 rounded-md border border-emerald-100 bg-white/80 p-3"
                            >
                              <DonorAvatar donor={donor} locale={locale} size={44} ringClassName={activeTierAvatarRing} />
                              <div className="text-sm font-medium text-emerald-900">
                                {getLocalizedSponsorName(donor, locale)}
                              </div>
                            </li>
                          ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-emerald-900/80">{donorListEmptyMessage}</p>
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
                              isActive ? "bg-emerald-500 text-white" : "bg-white border border-border text-muted-foreground hover:bg-muted/60"
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
                        {availableCryptoChains.map((chain, index) => {
                          const isActive = chain.value === selectedChain;
                          return (
                            <button
                              type="button"
                              key={`chain-${chain.value}`}
                              onClick={() => handleChainSelect(index)}
                              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition ${
                                isActive ? "bg-emerald-500 text-white" : "bg-white border border-border text-muted-foreground hover:bg-muted/60"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${chain.color}`} />
                                {chain.label}
                              </span>
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
                      {isStepOneSkipped ? <Circle className="w-4 h-4" /> : isStepOneComplete ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
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
                      {walletConnectError && <p className="text-xs text-red-600">{walletConnectError}</p>}
                      {walletConnectUri && (
                        <div className="flex justify-center">
                          <div className="rounded-lg bg-white p-4 shadow-sm">
                            <QRCode value={walletConnectUri} size={168} bgColor="#ffffff" fgColor="#111827" style={{ height: "168px", width: "168px" }} />
                          </div>
                        </div>
                      )}
                      {!walletConnectUri && walletConnectLoading && <p className="text-xs text-muted-foreground">{t("supportSection.wcWaiting")}</p>}
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
                            <span>{availableCryptoChains[safeChainIndex]?.label ?? ""}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{supportAmountLabel}</span>
                            <span>{formattedAmount}</span>
                          </div>
                          {!walletConnectSupportsTargetChain && (
                            <p className="text-amber-600">
                              {t("supportSection.wcSwitchHint", {
                                chain: availableCryptoChains[safeChainIndex]?.label ?? "",
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
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{stepTwoLabel}</div>
                      <h3 className="text-sm font-semibold leading-tight text-foreground mt-1">{stepTwoTitle}</h3>
                    </div>
                    <div className={`inline-flex items-center gap-1 text-xs font-medium ${stepTwoStatusClass}`}>
                      {canSendDonation ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      <span>{stepTwoStatusLabel}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{isFiatJPY ? stepTwoFiatDescription : stepTwoDescription}</p>
                  {isWalletConnectEligible && !canSendDonation && (
                    <p className="text-xs text-amber-600">{t("supportSection.wcConnectPrompt")}</p>
                  )}

                  {isFiatJPY && (
                    <div className="rounded-lg border border-border bg-white/80 p-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{bankNameLabel}</span>
                        <button onClick={() => copyToClipboard(bankNameLabel)} className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-xs">
                          <Copy className="w-3 h-3" /> {copyLabel}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{branchNameLabel}</span>
                        <button onClick={() => copyToClipboard(branchNameLabel)} className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-xs">
                          <Copy className="w-3 h-3" /> {copyLabel}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{accountNumberLabel}</span>
                        <button onClick={() => copyToClipboard(accountNumberLabel)} className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-xs">
                          <Copy className="w-3 h-3" /> {copyLabel}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{accountNameLabel}</span>
                        <button onClick={() => copyToClipboard(accountNameLabel)} className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-xs">
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
                    <Heart className="w-4 h-4" /> {donateButtonLabel} {getDisplayAmount()}
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
    </>
  );
};

export default ContributionSupportSection;
