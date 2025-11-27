'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAccount, useChainId, usePublicClient, useSendTransaction, useSwitchChain } from "wagmi";
import { CheckCircle2, Circle, Copy, Heart, Users, Wallet } from "lucide-react";

import {
  CHAIN_ID_MAP,
  CORPORATE_SPONSORS,
  DEFAULT_GAS_HEX,
  DONATION_ADDRESS,
  ERC20_METADATA,
  FIXED_AMOUNTS,
  INDIVIDUAL_SUPPORTERS,
  PREMIUM_SPONSORS,
  SUPPORT_TIER_ETH_AMOUNTS,
  TIER_AMOUNT_BADGES,
  TOKEN_TRANSFER_GAS_HEX,
} from "@/app/donate/constants";
import {
  convertMethodAmountToEth,
  encodeErc20Transfer,
  formatMethodAmount,
  isUserRejectedRequest,
  shortenAddress,
  toBaseUnits,
  toWei,
} from "@/app/donate/logic";
import type { CryptoChain, PaymentMethod, SponsorInfo, TokenPaymentMethod } from "@/app/donate/types";
import { SupportTierButton, type SupportBenefit } from "./SupportTierButton";
import { getLocalizedSponsorName } from "./DonorAvatar";
import { isWalletConnectConfigured } from "@/lib/appkit/config";
import { BaseError, type Address } from "viem";

type PaymentOption = { value: PaymentMethod; label: string; type: "crypto" | "fiat" };

const ContributionSupportSection = () => {
  const t = useTranslations("contribution");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [selectedChain, setSelectedChain] = useState<CryptoChain>("ethereum");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("ETH");
  const [selectedAmountIndex, setSelectedAmountIndex] = useState(0);
  const [activeTier, setActiveTier] = useState<keyof typeof SUPPORT_TIER_ETH_AMOUNTS | null>(null);
  const {
    address: connectedAddress,
    isConnected: isAccountConnected,
    status: accountStatus,
  } = useAccount();
  const connectedChainIdFromHook = useChainId();
  const { sendTransactionAsync, isPending: isSendingTransaction } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const [, setWalletStatusMessage] = useState<string | null>(null);

  const premiumTierDonors = useMemo(() => PREMIUM_SPONSORS, []);
  const sponsorTierDonors = useMemo(() => CORPORATE_SPONSORS, []);
  const supporterTierDonors = useMemo(() => INDIVIDUAL_SUPPORTERS, []);
  const tierDonors = useMemo<Record<keyof typeof SUPPORT_TIER_ETH_AMOUNTS, SponsorInfo[]>>(
    () => ({
      premium: premiumTierDonors,
      sponsor: sponsorTierDonors,
      supporter: supporterTierDonors,
    }),
    [premiumTierDonors, sponsorTierDonors, supporterTierDonors]
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

  const premiumBenefitsRaw = t.raw("supportSection.benefitsPremium");
  const premiumBenefits = Array.isArray(premiumBenefitsRaw) ? (premiumBenefitsRaw as SupportBenefit[]) : [];
  const sponsorBenefitsRaw = t.raw("supportSection.benefitsSponsor");
  const sponsorBenefits = Array.isArray(sponsorBenefitsRaw) ? (sponsorBenefitsRaw as SupportBenefit[]) : [];
  const supporterBenefitsRaw = t.raw("supportSection.benefitsSupporter");
  const supporterBenefits = Array.isArray(supporterBenefitsRaw) ? (supporterBenefitsRaw as SupportBenefit[]) : [];

  const planStepLabel = t("supportSection.planSelectionStep.label");
  const planStepTitle = t("supportSection.planSelectionStep.title");
  const premiumBenefitsHeading = t("supportSection.benefitsPremiumHeading");
  const premiumAvailabilityLabel = t("supportSection.premiumAvailability");
  const sponsorAvailabilityLabel = t("supportSection.sponsorAvailability");
  const sponsorBenefitsHeading = t("supportSection.benefitsSponsorHeading");
  const supporterBenefitsHeading = t("supportSection.benefitsSupporterHeading");
  const supportHeading = t("supportSection.heading");
  const supportIntro = t("supportSection.intro");
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
  const publicClient = usePublicClient({ chainId: targetChainId });
  const getReadableError = useCallback(
    (error: unknown) => {
      if (!error) {
        return "";
      }
      if (typeof error === "string") {
        return error;
      }
      if (error instanceof BaseError) {
        const shortMessage = error.shortMessage?.trim();
        const causeMessage = error.cause instanceof BaseError ? error.cause.shortMessage : error.cause instanceof Error ? error.cause.message : undefined;
        return (shortMessage || causeMessage || "").trim();
      }
      if (error instanceof Error) {
        return error.message;
      }
      return "";
    },
    []
  );
  const connectedChainId = connectedChainIdFromHook ?? null;
  const walletConnectAddressForTarget = connectedAddress ?? null;
  const walletConnectSupportsTargetChain = connectedChainId === targetChainId;
  const isWalletConnecting = accountStatus === "connecting" || accountStatus === "reconnecting";
  const isWalletConnected = Boolean(connectedAddress) && Boolean(isAccountConnected);

  useEffect(() => {
    if (isWalletConnected && walletConnectSupportsTargetChain) {
      setWalletStatusMessage(null);
    }
  }, [isWalletConnected, walletConnectSupportsTargetChain]);

  const isStepOneComplete = isWalletConnectEligible ? isWalletConnected && walletConnectSupportsTargetChain : true;
  const canSendDonation = !isWalletConnectEligible || (isStepOneComplete && isWalletConnectConfigured && !isSendingTransaction);
  const isStepOneSkipped = isFiatJPY;
  const stepOneStatusLabel = isStepOneSkipped ? stepStatusSkipped : isStepOneComplete ? stepStatusComplete : stepStatusPending;
  const stepTwoStatusLabel = canSendDonation ? stepStatusReady : stepStatusAction;
  const stepOneStatusClass = isStepOneSkipped ? "text-muted-foreground" : isStepOneComplete ? "text-emerald-600" : "text-muted-foreground";
  const stepTwoStatusClass = canSendDonation ? "text-emerald-600" : "text-amber-600";
  const donateButtonLabel = isFiatJPY ? supportCompleteCta : supportDonateCta;

  const { stepTwoHelperText, stepTwoHelperTone } = useMemo(() => {
    if (!isWalletConnectEligible) {
      return { stepTwoHelperText: null as string | null, stepTwoHelperTone: "muted" as const };
    }
    if (!isWalletConnected) {
      if (isWalletConnecting) {
        return { stepTwoHelperText: t("supportSection.wcConnecting"), stepTwoHelperTone: "muted" as const };
      }
      return { stepTwoHelperText: t("supportSection.wcConnectPrompt"), stepTwoHelperTone: "warning" as const };
    }
    if (!walletConnectSupportsTargetChain) {
      const chainLabel = availableCryptoChains[safeChainIndex]?.label ?? "";
      return {
        stepTwoHelperText: t("supportSection.wcSwitchHint", { chain: chainLabel }),
        stepTwoHelperTone: "warning" as const,
      };
    }
    if (!isWalletConnectConfigured) {
      return { stepTwoHelperText: t("supportSection.wcNeedsProject"), stepTwoHelperTone: "warning" as const };
    }
    if (isSendingTransaction) {
      return { stepTwoHelperText: t("supportSection.wcWaiting"), stepTwoHelperTone: "muted" as const };
    }
    return { stepTwoHelperText: null as string | null, stepTwoHelperTone: "muted" as const };
  }, [
    availableCryptoChains,
    isSendingTransaction,
    isWalletConnectEligible,
    isWalletConnected,
    isWalletConnecting,
    safeChainIndex,
    t,
    walletConnectSupportsTargetChain,
  ]);

  const requestSwitchChain = useCallback(
    async (chainId: number, chainLabel: string) => {
      setWalletStatusMessage(null);
      if (!switchChainAsync) {
        setWalletStatusMessage(
          t("supportSection.wcSwitchHint", {
            chain: chainLabel,
          })
        );
        return false;
      }
      try {
        await switchChainAsync({ chainId });
        setWalletStatusMessage(null);
        return true;
      } catch (error) {
        console.error(error);
        if (isUserRejectedRequest(error)) {
          setWalletStatusMessage(t("supportSection.wcRequestRejected"));
        } else {
          setWalletStatusMessage(t("supportSection.wcConnectError"));
        }
        return false;
      }
    },
    [switchChainAsync, t]
  );

  useEffect(() => {
    setWalletStatusMessage(null);
  }, [connectedAddress, connectedChainId, isWalletConnectEligible, selectedChain, selectedMethod]);

  const handleMethodChange = useCallback((method: PaymentMethod) => {
    setSelectedMethod(method);
  }, []);

  const getAppKitModal = () => (typeof window !== "undefined" ? window.__NYX_APPKIT_MODAL__ : undefined);

  const handleChainSelect = useCallback(
    async (index: number) => {
      const target = availableCryptoChains[index]?.value;
      if (!target) {
        return;
      }
      const previousChain = selectedChain;
      setSelectedChain(target);
      const desiredChainId = CHAIN_ID_MAP[target] ?? CHAIN_ID_MAP.ethereum;
      const desiredChainLabel = availableCryptoChains[index]?.label ?? "";
      if (isWalletConnected && connectedChainId !== desiredChainId) {
        const switched = await requestSwitchChain(desiredChainId, desiredChainLabel);
        if (!switched) {
          setSelectedChain(previousChain);
        }
      }
    },
    [availableCryptoChains, connectedChainId, isWalletConnected, requestSwitchChain, selectedChain]
  );

  const handleTierClick = useCallback(
    (tier: keyof typeof SUPPORT_TIER_ETH_AMOUNTS) => {
      const targetEth = SUPPORT_TIER_ETH_AMOUNTS[tier];
      const ethAmounts = FIXED_AMOUNTS.ETH ?? [];
      const foundIndex = ethAmounts.findIndex((value) => Math.abs(value - targetEth) < 1e-9);
      const targetIndex = foundIndex === -1 ? 0 : foundIndex;

      setActiveTier(tier);
      handleMethodChange("ETH");
      setSelectedAmountIndex(targetIndex);
    },
    [handleMethodChange]
  );

  const handleOpenWalletModal = useCallback(async () => {
    if (!isWalletConnectConfigured) {
      alert(t("supportSection.wcNeedsProject"));
      return;
    }
    const modal = getAppKitModal();
    if (!modal) {
      alert(t("supportSection.wcConnectError"));
      return;
    }
    try {
      const view = isWalletConnected ? "Account" : "Connect";
      await modal.open({ view, namespace: "eip155" });
    } catch (error) {
      console.error(error);
      alert(t("supportSection.wcConnectError"));
    }
  }, [isWalletConnected, t]);

  const handlePayment = useCallback(async () => {
    if (isWalletConnectEligible) {
      if (!isWalletConnectConfigured) {
        alert(t("supportSection.wcNeedsProject"));
        return;
      }
      if (!isWalletConnected || !connectedAddress) {
        const prompt = isWalletConnecting
          ? t("supportSection.wcConnecting")
          : t("supportSection.wcConnectPrompt");
        setWalletStatusMessage(prompt);
        alert(prompt);
        return;
      }
      if (!walletConnectSupportsTargetChain) {
        const chainLabel = availableCryptoChains[safeChainIndex]?.label ?? "";
        const switched = await requestSwitchChain(targetChainId, chainLabel);
        if (!switched) {
          return;
        }
      }
      try {
        const account = connectedAddress as Address;
        const tokenContract = selectedTokenContract as Address | null;
        const baseUnits = isTokenPayment ? toBaseUnits(currentAmount, selectedTokenDecimals) : null;
        if (isTokenPayment) {
          if (!tokenContract) {
            throw new Error("Token contract unavailable for selected chain.");
          }
          if (baseUnits === null || baseUnits === BigInt(0)) {
            throw new Error("Amount must be greater than zero.");
          }
        }
        const weiValue = !isTokenPayment ? toWei(currentEthAmount) : null;
        if (!isTokenPayment && (weiValue === null || weiValue === BigInt(0))) {
          throw new Error("Amount must be greater than zero.");
        }

        if (publicClient) {
          try {
            if (isTokenPayment && tokenContract && baseUnits) {
              await publicClient.estimateGas({
                account,
                to: tokenContract,
                data: encodeErc20Transfer(DONATION_ADDRESS, baseUnits) as `0x${string}`,
                value: BigInt(0),
              });
            } else if (!isTokenPayment && weiValue !== null) {
              await publicClient.estimateGas({
                account,
                to: DONATION_ADDRESS as Address,
                value: weiValue,
              });
            }
          } catch (simulationError) {
            console.error(simulationError);
            const readable = getReadableError(simulationError) || t("supportSection.wcRequestError");
            const message = t("supportSection.wcSimulationFailed", { message: readable });
            setWalletStatusMessage(message);
            alert(message);
            return;
          }
        }

        setWalletStatusMessage(t("supportSection.wcRequestSent"));
        const txHash = await (async () => {
          if (isTokenPayment && tokenContract && baseUnits) {
            return sendTransactionAsync({
              account,
              chainId: targetChainId,
              to: tokenContract,
              value: BigInt(0),
              gas: BigInt(TOKEN_TRANSFER_GAS_HEX),
              data: encodeErc20Transfer(DONATION_ADDRESS, baseUnits) as `0x${string}`,
            });
          }
          return sendTransactionAsync({
            account,
            chainId: targetChainId,
            to: DONATION_ADDRESS as Address,
            value: weiValue ?? BigInt(0),
            gas: BigInt(DEFAULT_GAS_HEX),
          });
        })();

        if (publicClient) {
          try {
            setWalletStatusMessage(t("supportSection.wcAwaitingConfirmation"));
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
            if (receipt.status !== "success") {
              throw new Error(
                t("supportSection.wcTxFailed", {
                  message: receipt.status === "reverted" ? t("supportSection.wcTxReverted") : receipt.status,
                })
              );
            }
          } catch (confirmationError) {
            console.error(confirmationError);
            const readable = getReadableError(confirmationError) || t("supportSection.wcTxFailedNoDetails");
            const message = t("supportSection.wcTxFailed", { message: readable });
            setWalletStatusMessage(message);
            alert(message);
            return;
          }
        }

        const params = new URLSearchParams();
        params.set("amount", currentAmount.toString());
        params.set("displayAmount", formattedAmount);
        params.set("method", selectedMethod);
        if (!isFiatJPY) {
          params.set("chain", selectedChain);
        }
        params.set("address", connectedAddress);
        if (txHash) {
          params.set("txHash", txHash);
        }
        const query = params.toString();
        router.push(`/thankyou-donation${query ? `?${query}` : ""}`);
      } catch (error) {
        console.error(error);
        if (isUserRejectedRequest(error)) {
          setWalletStatusMessage(t("supportSection.wcRequestRejected"));
          alert(t("supportSection.wcRequestRejected"));
        } else {
          const fallback = t("supportSection.wcRequestError");
          const readable = getReadableError(error);
          const combined = readable ? `${fallback}\n${readable}` : fallback;
          setWalletStatusMessage(readable || fallback);
          alert(combined);
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
    connectedAddress,
    currentAmount,
    currentEthAmount,
    formattedAmount,
    isFiatJPY,
    isWalletConnectEligible,
    isTokenPayment,
    isWalletConnected,
    isWalletConnecting,
    getReadableError,
    publicClient,
    requestSwitchChain,
    router,
    safeChainIndex,
    selectedChain,
    selectedMethod,
    selectedTokenContract,
    selectedTokenDecimals,
    sendTransactionAsync,
    setWalletStatusMessage,
    t,
    targetChainId,
    walletConnectSupportsTargetChain,
  ]);

  const getDisplayAmount = () => formattedAmount;

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    <section id="support-nyx" className="mb-28 md:mb-36">
      <div className="mx-auto max-w-6xl space-y-10 text-left">
        <div className="space-y-3 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold">{supportHeading}</h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{supportIntro}</p>
        </div>

        <div className="space-y-6 md:space-y-7">
          {(premiumBenefits.length > 0 || sponsorBenefits.length > 0 || supporterBenefits.length > 0) && (
            <div className="border border-border rounded-lg bg-muted/10 p-5 md:p-6 space-y-4 md:space-y-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{planStepLabel}</div>
                  <h3 className="text-sm font-semibold text-foreground mt-1">{planStepTitle}</h3>
                </div>
              </div>
              <div className="grid gap-6 md:gap-4 xl:gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                    availabilityLabel={premiumAvailabilityLabel}
                    locale={locale}
                    isActive={activeTier === "premium"}
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
                    availabilityLabel={sponsorAvailabilityLabel}
                    locale={locale}
                    isActive={activeTier === "sponsor"}
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
                    isActive={activeTier === "supporter"}
                  />
                )}
              </div>
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
                          onClick={() => {
                            void handleChainSelect(index);
                          }}
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
                  <button
                    type="button"
                    onClick={() => {
                      void handleOpenWalletModal();
                    }}
                    disabled={!isWalletConnectConfigured}
                    className="w-full h-14 md:h-16 rounded-lg bg-emerald-500 text-white text-base font-semibold shadow-sm transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isWalletConnected ? (
                      <span className="flex flex-col items-center gap-1 text-sm md:text-base">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" /> {t("supportSection.wcConnected")}
                        </span>
                        <span className="font-mono text-xs md:text-sm text-white/90">
                          {shortenAddress(walletConnectAddressForTarget ?? connectedAddress ?? "") || "—"}
                          {availableCryptoChains[safeChainIndex]?.label
                            ? ` · ${availableCryptoChains[safeChainIndex]?.label ?? ""}`
                            : ""}
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Wallet className="w-5 h-5" /> {t("supportSection.wcTitle")}
                      </span>
                    )}
                  </button>
                  {isWalletConnected && (
                    <div className="space-y-2 rounded-lg border border-border bg-white/60 p-4 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{t("supportSection.wcConnected")}</span>
                        <span className="font-mono text-foreground/90">{shortenAddress(walletConnectAddressForTarget ?? connectedAddress ?? "") || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{supportChainLabel}</span>
                        <span>{availableCryptoChains[safeChainIndex]?.label ?? ""}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{supportAmountLabel}</span>
                        <span>{formattedAmount}</span>
                      </div>
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
              {stepTwoHelperText && (
                <p
                  className={`text-xs leading-relaxed ${
                    stepTwoHelperTone === "warning" ? "text-amber-600" : "text-muted-foreground"
                  }`}
                >
                  {stepTwoHelperText}
                </p>
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
                <Heart className="w-4 h-4" /> {isSendingTransaction ? t("supportSection.wcWaiting") : donateButtonLabel} {getDisplayAmount()}
              </button>
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground leading-relaxed">
                {walletConnectFallbackNote}
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/contact"
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <Users className="w-4 h-4" /> {supportOrganizationsCta}
        </Link>
      </div>
    </section>
  );
};

export default ContributionSupportSection;
