"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ThankYouDonationPage() {
  const t = useTranslations("thankYouDonation");
  const searchParams = useSearchParams();

  const displayAmount = searchParams.get("displayAmount") ?? "";
  const rawAmount = searchParams.get("amount") ?? "";
  const method = searchParams.get("method") ?? "";
  const chain = searchParams.get("chain") ?? "";
  const wallet = searchParams.get("address") ?? "";
  const txHash = searchParams.get("txHash") ?? "";

  const defaultAnonymous = useMemo(() => t("banner.anonymous"), [t]);
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [amountInput, setAmountInput] = useState(displayAmount || rawAmount);
  const [walletInput, setWalletInput] = useState(wallet);
  const [urlInput, setUrlInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const donationSummary = useMemo(
    () => ({
      amount: displayAmount || rawAmount,
      method,
      chain,
      wallet,
      txHash,
    }),
    [displayAmount, rawAmount, method, chain, wallet, txHash]
  );

  const currency = useMemo(() => {
    if (!method) return "";
    const upper = method.toUpperCase();
    if (upper === "JPY") {
      return "JPY";
    }
    return upper;
  }, [method]);

  const amountDisplay = amountInput.trim() || donationSummary.amount || "—";
  const nameDisplay = name.trim() || defaultAnonymous;
  const isValidIconUrl = /^https?:\/\//i.test(iconUrl.trim());
  const bannerIconUrl = isValidIconUrl ? iconUrl.trim() : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      const submissionName = nameDisplay;
      formData.set("name", submissionName);
      formData.set("address", walletInput.trim());
      formData.set("amount", amountInput.trim());
      if (currency) {
        formData.set("currency", currency);
      }
      if (bannerIconUrl) {
        formData.set("icon", bannerIconUrl);
      }
      formData.set("url", urlInput.trim());

      const response = await fetch("/api/donations", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      setSubmitted(true);
    } catch (error) {
      console.error(error);
      setSubmitError(t("form.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[60vh] px-5 md:px-8 py-16 md:py-20 bg-muted/20">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/donate"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </Link>

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 md:p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>

          <div
            className="relative overflow-hidden rounded-[32px] bg-[#090c16] shadow-[0_30px_80px_rgba(22,24,45,0.55)]"
            aria-label={t("banner.heading")}
          >
            <div className="absolute inset-0"> 
              <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="absolute -bottom-28 right-0 h-72 w-72 translate-x-1/3 rounded-full bg-indigo-500/25 blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0))]" />
            </div>

            <div className="relative z-10 px-8 py-10 md:px-12 md:py-12 space-y-7">
              <div className="flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">
                <Image src="/icon.svg" alt="Nyx Foundation" width={40} height={40} className="h-10 w-10" />
                <p className="text-lg font-semibold tracking-tight text-white">{t("banner.tagline")}</p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-white/70">{t("banner.amount")}</span>
                  <span className="text-4xl md:text-5xl font-bold leading-none bg-gradient-to-r from-emerald-200 via-cyan-200 to-indigo-200 bg-clip-text text-transparent">
                    {amountDisplay}
                  </span>
                </div>

                <div className="flex items-center gap-4 rounded-full border border-white/20 bg-white/10 px-5 py-3 backdrop-blur">
                  <div className="relative">
                    <span className="absolute inset-0 rounded-full bg-emerald-400/40 blur-sm" />
                    <div className="relative h-12 w-12 rounded-full overflow-hidden border border-white/30 bg-white/15 shadow-inner">
                      {bannerIconUrl ? (
                        <Image
                          src={bannerIconUrl}
                          alt="Supporter icon"
                          width={48}
                          height={48}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="text-lg font-semibold tracking-tight text-white">{nameDisplay}</div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">{t("banner.share")}</p>

          <p className="text-sm text-muted-foreground text-center">{t("form.intro")}</p>

          <div className="grid gap-6">
            <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3 text-sm">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-[0.14em]">
                {t("summary.heading")}
              </h2>
              <dl className="grid gap-2 text-muted-foreground">
                {donationSummary.amount && (
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                    <dt className="font-medium text-foreground">{t("summary.amount")}</dt>
                    <dd>{donationSummary.amount}</dd>
                  </div>
                )}
                {donationSummary.method && (
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                    <dt className="font-medium text-foreground">{t("summary.method")}</dt>
                    <dd>{donationSummary.method}</dd>
                  </div>
                )}
                {donationSummary.chain && (
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                    <dt className="font-medium text-foreground">{t("summary.chain")}</dt>
                    <dd>{donationSummary.chain}</dd>
                  </div>
                )}
                {donationSummary.wallet && (
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                    <dt className="font-medium text-foreground">{t("summary.wallet")}</dt>
                    <dd className="font-mono text-xs md:text-sm break-all text-foreground/80">{donationSummary.wallet}</dd>
                  </div>
                )}
                {donationSummary.txHash && (
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                    <dt className="font-medium text-foreground">{t("summary.txHash")}</dt>
                    <dd className="font-mono text-xs md:text-sm break-all text-foreground/80">{donationSummary.txHash}</dd>
                  </div>
                )}
              </dl>
            </div>

            {submitted ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-700 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">{t("form.completed")}</p>
                  <p className="text-sm mt-1">{t("form.completedDescription")}</p>
                </div>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="donor-name" className="text-sm font-medium text-foreground">
                    {t("form.nameLabel")}
                  </label>
                  <input
                    id="donor-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t("form.namePlaceholder")}
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="donor-icon-url" className="text-sm font-medium text-foreground">
                    {t("form.iconLabel")}
                  </label>
                  <input
                    id="donor-icon-url"
                    type="url"
                    value={iconUrl}
                    onChange={(event) => setIconUrl(event.target.value)}
                    placeholder="https://"
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                  {bannerIconUrl ? (
                    <Image
                      src={bannerIconUrl}
                      alt="Icon preview"
                      width={80}
                      height={80}
                      unoptimized
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : iconUrl.trim() ? (
                    <p className="text-xs text-red-500">{t("form.iconInvalid")}</p>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="donation-amount" className="text-sm font-medium text-foreground">
                      {t("form.amountLabel")}
                    </label>
                    <input
                      id="donation-amount"
                      type="text"
                      value={amountInput}
                      onChange={(event) => setAmountInput(event.target.value)}
                      className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="donation-wallet" className="text-sm font-medium text-foreground">
                      {t("form.addressLabel")}
                    </label>
                    <input
                      id="donation-wallet"
                      type="text"
                      value={walletInput}
                      onChange={(event) => setWalletInput(event.target.value)}
                      className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="donor-url" className="text-sm font-medium text-foreground">
                    {t("form.urlLabel")}
                  </label>
                  <input
                    id="donor-url"
                    type="url"
                    value={urlInput}
                    onChange={(event) => setUrlInput(event.target.value)}
                    placeholder={t("form.urlPlaceholder")}
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  {isSubmitting ? t("form.submitting") : t("form.submit")}
                </button>

                {submitError && <p className="text-sm text-red-600">{submitError}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
