"use client";

import { useTranslations, useLocale } from "next-intl";
import { ExternalLink, Heart, PieChart, Users, Lightbulb, ChevronDown, ChevronUp, Copy, BookOpen, ShieldCheck, FunctionSquare, Globe, Shirt, Calendar, BadgeCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ActivityModal } from "@/components/activity/ActivityModal";

export default function ContributionPage() {
  const t = useTranslations("contribution");
  const locale = useLocale();

  // Donation UI state (JP default)
  const [selectedAmount, setSelectedAmount] = useState("3000");
  const [customAmount, setCustomAmount] = useState("");
  const [donationType, setDonationType] = useState<"onetime" | "monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState<"JPY" | "ETH">("JPY");
  const [selectedChain, setSelectedChain] = useState("ethereum");
  const [selectedToken, setSelectedToken] = useState("ETH");
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "bank" | "crypto">("credit");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const fixedCreditOnly = (currency === "JPY" && (donationType === "monthly" || donationType === "yearly"));

  const predefinedAmounts = {
    ETH: [
      { value: "0.005", label: "0.005 ETH" },
      { value: "0.01", label: "0.01 ETH" },
      { value: "0.015", label: "0.015 ETH" },
      { value: "0.025", label: "0.025 ETH" },
      { value: "0.05", label: "0.05 ETH" },
      { value: "0.1", label: "0.1 ETH" },
    ],
    JPY: [
      { value: "1000", label: "1,000円" },
      { value: "2000", label: "2,000円" },
      { value: "3000", label: "3,000円" },
      { value: "5000", label: "5,000円" },
      { value: "10000", label: "10,000円" },
      { value: "20000", label: "20,000円" },
    ],
  } as const;

  const cryptoChains = [
    { value: "ethereum", label: "Ethereum", color: "bg-gray-500" },
    { value: "optimism", label: "Optimism", color: "bg-red-500" },
    { value: "arbitrum", label: "Arbitrum", color: "bg-blue-500" },
    { value: "polygon", label: "Polygon", color: "bg-purple-500" },
  ];

  const cryptoTokens = [
    { value: "ETH", label: "ETH", chain: "Ethereum" },
    { value: "USDC", label: "USDC", chain: "Multi-chain" },
    { value: "USDT", label: "USDT", chain: "Multi-chain" },
    { value: "DAI", label: "DAI", chain: "Ethereum" },
  ];

  const corporateSponsors = [
    { name: "Ethereum Foundation", jpname: "イーサリアム財団", logo: "/sponsors/ef.jpg" },
    { name: "Geodework", jpname: "ジオデワーク", logo: "/sponsors/geodework.jpg" },
    { name: "Polygon", jpname: "ポリゴン", logo: "/sponsors/polygon.jpeg" },
    { name: "GuildQB", jpname: "ギルドQB", logo: "/sponsors/guildqb.png" },
    { name: "KIRIFUDA Inc.", jpname: "キリフダ株式会社", logo: "/sponsors/kirifuda.jpg" },
    { name: "DeSci Tokyo", jpname: "デサイ東京", logo: "/sponsors/desci.jpg" },
  ];
  const individualSupporters = [
    { name: "chikeo", jpname: "チケ男", logo: "/sponsors/ticket.jpg" },
    { name: "KIMINORI JAPAN", jpname: "キミノリ・ジャパン", logo: "/sponsors/kiminorijapan.jpg" },
    { name: "Hiro Shimo", jpname: "志茂 博", logo: "/sponsors/shimo.jpg" },
    { name: "Anonymous", jpname: "匿名希望", logo: null },
  ];

  const impactCards = [
    {
      title: "研究",
      // 活動の説明文から引用
      desc: "最先端の分散システムと暗号技術の研究開発を行っています。ブロックチェーン、ゼロ知識証明、マルチパーティ計算などの基礎研究から実装まで幅広く取り組んでいます。",
      icon: <BookOpen className="w-6 h-6" />,
    },
    {
      title: "ホワイトハッキング",
      desc: "クライアントやインフラの脆弱性調査・負荷試験を行い、バグを修正・報告することで安全性を高めます。",
      icon: <ShieldCheck className="w-6 h-6" />,
    },
    {
      title: "形式検証",
      // 活動の説明文から引用
      desc: "数学的手法を用いてスマートコントラクト、プロトコル、暗号アルゴリズムの正確性と安全性を証明します。",
      icon: <FunctionSquare className="w-6 h-6" />,
    },
  ];

  // testimonials セクションは削除（要望）

  const recentUpdates = [
    { title: "Gethに貢献しました", date: "2025/8/20" },
    { title: "耐量子署名の実装", date: "2025/8/18" },
    { title: "共同研究開始：香港科技大 川口康平氏", date: "2025/8/7" },
    { title: "zkSNARKsライブラリの最適化", date: "2025/7/25" },
    { title: "分散システム論文がACM採択", date: "2025/7/15" },
    { title: "Ethereum Core Dev会議参加", date: "2025/7/10" },
  ];

  const faqData = [
    { question: "寄付金はどのように使われますか？", answer: "寄付金は研究費（45%）、人件費（30%）、運営費（15%）、リザーブ（10%）に配分されます。四半期ごとに詳細な使途報告書を公開しています。" },
    { question: "領収書は発行されますか？", answer: "はい、すべての寄付に対して領収書を発行いたします。クレジットカード決済は決済後すぐに、銀行振込・暗号資産は着金確認後にメールでお送りします。" },
    { question: "暗号資産での寄付は安全ですか？", answer: "Ethereum、Optimism、Arbitrum、Polygonの主要チェーンに対応しています。初回は少額でのテスト送金を推奨しております。" },
    { question: "継続寄付の停止や金額変更はできますか？", answer: "はい、いつでも可能です。お問い合わせフォームまたはメール（contact@nyx.foundation）でご連絡ください。" },
    { question: "法人での寄付や協賛は可能ですか？", answer: "もちろんです。法人様向けに研究パートナーシップやスポンサーシップのプログラムもあります。" },
    { question: "寄付者特典はいつ受け取れますか？", answer: "ロゴ掲載は寄付確認後1週間以内、グッズ配送は月末締めで翌月発送、イベント参加権は開催1ヶ月前にご案内、NFTは四半期ごとに配布予定です。" },
  ];

  const getAvailablePaymentMethods = () => {
    if (currency === "JPY") {
      // 毎月/毎年はクレジットカードのみ、今回のみは銀行振込も許可
      if (donationType === "monthly" || donationType === "yearly") {
        return [{ value: "credit", label: "クレジットカード" }] as const;
      }
      return [
        { value: "credit", label: "クレジットカード" },
        { value: "bank", label: "銀行振込" },
        { value: "crypto", label: "暗号資産" },
      ] as const;
    }
    return [{ value: "crypto", label: "暗号資産" }];
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const handleCurrencyChange = (newCurrency: "JPY" | "ETH") => {
    setCurrency(newCurrency);
    if (newCurrency === "JPY") {
      setSelectedAmount("3000");
      setPaymentMethod("credit");
      setDonationType("monthly");
    } else {
      setSelectedAmount("0.015");
      setPaymentMethod("crypto");
      setDonationType("onetime");
    }
    setCustomAmount("");
  };

  // 支払い方法の整合性を常に保つ（毎月/毎年=クレカのみ、ETH=暗号資産のみ）
  useEffect(() => {
    if (currency === "JPY" && (donationType === "monthly" || donationType === "yearly") && paymentMethod !== "credit") {
      setPaymentMethod("credit");
    }
    if (currency === "ETH" && paymentMethod !== "crypto") {
      setPaymentMethod("crypto");
    }
  }, [currency, donationType, paymentMethod]);

  const getDisplayAmount = () => {
    if (selectedAmount === "custom") {
      if (currency === "ETH") return customAmount ? `${customAmount} ETH` : "0 ETH";
      return customAmount ? `${Number.parseInt(customAmount).toLocaleString()}円` : "0円";
    }
    const list = predefinedAmounts[currency];
    const found = list.find((a) => a.value === (selectedAmount as any));
    return found ? found.label : currency === "ETH" ? "0 ETH" : "0円";
  };

  const toggleFAQ = (idx: number) => setOpenFAQ(openFAQ === idx ? null : idx);

  const handlePayment = () => {
    alert(
      `支払いページに移動します: ${getDisplayAmount()} ${
        donationType === "monthly" ? "毎月" : donationType === "yearly" ? "毎年" : "今回のみ"
      }`
    );
  };

  return (
    <div className="min-h-screen px-4 pt-10 md:pt-12 pb-20 md:pb-24">
      <div className="container mx-auto max-w-6xl">
        {/* Hero with Donation Card */}
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 md:gap-14 items-center mb-20">
          <div className="space-y-4 md:space-y-5">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              {locale === "ja" ? (
                <>
                  毎月<span className="font-sans">1,000</span>円から、<br />研究に追い風を。
                </>
              ) : (
                <>
                  From 1,000 JPY/month,<br />Tailwind for Research.
                </>
              )}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              <span className="font-semibold">「オープンイノベーションのための検証可能な未来を築く」</span>というビジョンの下、分散システムや暗号技術の研究開発を行っています。寄付を通じて我々の活動を支援することができます。寄付額は自由です。
            </p>
            <p className="text-sm text-muted-foreground">いつでも解約・金額変更できます。</p>
            {/* 法人の方向け導線は非表示（要望） */}
          </div>

          <div className="rounded-xl px-7 pt-5 pb-5 bg-white shadow-sm ring-1 ring-gray-100">
            <div className={fixedCreditOnly ? "space-y-3 md:space-y-4" : "space-y-4 md:space-y-5"}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* 今回/毎月/毎年（v0風: 選択中は濃いグレー、文字白） */}
                <div className="inline-flex bg-gray-100 rounded-lg p-1 flex-wrap gap-1">
                  {([
                    { key: "onetime", label: "今回のみ" },
                    { key: "monthly", label: "毎月" },
                    { key: "yearly", label: "毎年" },
                  ] as const).map((opt) => (
                    (() => {
                      const cryptoLocked = currency === "ETH" || paymentMethod === "crypto";
                      const disabled = cryptoLocked && opt.key !== "onetime";
                      const active = donationType === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => !disabled && setDonationType(opt.key)}
                          disabled={disabled}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            active ? "bg-gray-700 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
                          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                          aria-pressed={active}
                          aria-disabled={disabled}
                        >
                          {opt.label}
                        </button>
                      );
                    })()
                  ))}
                </div>
                <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1">
                  <button
                    onClick={() => handleCurrencyChange("JPY")}
                    className={`px-2 py-1 text-xs font-medium transition-all ${
                      currency === "JPY" ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    円
                  </button>
                  <span className="text-gray-400 mx-1 text-xs">/</span>
                  <button
                    onClick={() => handleCurrencyChange("ETH")}
                    className={`px-2 py-1 text-xs font-medium transition-all ${
                      currency === "ETH" ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    暗号資産
                  </button>
                </div>
              </div>
              {(currency === "ETH" || paymentMethod === "crypto") && (
                <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5">
                  暗号資産では毎月/毎年のご支援を選択いただけません。
                </p>
              )}

              <div className="space-y-3 md:space-y-4">
                <div className="text-sm font-medium">金額を選択</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-3.5">
                  {predefinedAmounts[currency].map((amount) => (
                    <button
                      key={amount.value}
                      onClick={() => {
                        setSelectedAmount(amount.value);
                        setCustomAmount("");
                      }}
                      className={`py-3 px-3 text-center border rounded-lg transition-all ${
                        selectedAmount === amount.value
                          ? "border-gray-400 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="font-medium text-sm md:text-base">{amount.label}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedAmount("custom")}
                  className={`w-full py-3 px-3 text-center border rounded-lg transition-all ${
                    selectedAmount === "custom"
                      ? "border-gray-400 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="font-medium text-base">カスタム</div>
                  {selectedAmount === "custom" && (
                    <input
                      type="number"
                      placeholder={currency === "ETH" ? "0.01" : "50000"}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="mt-2 w-full border border-gray-300 rounded px-3 py-2 text-center"
                      min={currency === "ETH" ? 0.001 : 500}
                      step={currency === "ETH" ? 0.001 : 100}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </button>
              </div>

              <div className={fixedCreditOnly ? "space-y-2" : "space-y-3"}>
                {/* 支払い方法/トークン選択 */}
                {currency === "ETH" ? (
                  <>
                    <div className="text-sm font-medium">お支払トークン / チェーン</div>
                    <div className="relative">
                      <button
                        onClick={() => setShowPaymentOptions((s) => !s)}
                        className="w-full p-4 text-left border rounded-lg bg-white flex items-center justify-between hover:bg-muted/50"
                      >
                        <span className="font-medium">{selectedToken}</span>
                        <span className="text-xs text-muted-foreground">{showPaymentOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
                      </button>
                      {showPaymentOptions && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow z-20">
                          {cryptoTokens.map((token) => (
                            <button
                              key={token.value}
                              onClick={() => {
                                setSelectedToken(token.value);
                                setShowPaymentOptions(false);
                              }}
                              className={`w-full p-3 text-left hover:bg-muted/50 ${selectedToken === token.value ? "bg-muted" : ""}`}
                            >
                              <div className="font-medium">{token.label}</div>
                              <div className="text-xs text-muted-foreground">{token.chain}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : donationType === "monthly" || donationType === "yearly" ? (
                  <>
                    <div className="text-sm font-medium">支払い方法</div>
                    <div className="w-full p-3 text-left border rounded-lg bg-white flex items-center justify-between">
                      <span className="font-medium">クレジットカード</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-medium">支払い方法</div>
                    <div className="relative">
                      <button
                        onClick={() => setShowPaymentOptions((s) => !s)}
                        className="w-full p-4 text-left border rounded-lg bg-white flex items-center justify-between hover:bg-muted/50"
                      >
                        <span className="font-medium">{getAvailablePaymentMethods().find((m) => m.value === paymentMethod)?.label || "支払い方法を選択"}</span>
                        <span className="text-xs text-muted-foreground">{showPaymentOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
                      </button>
                      {showPaymentOptions && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow z-20">
                          {getAvailablePaymentMethods().map((m) => (
                            <button
                              key={m.value}
                              onClick={() => {
                                setPaymentMethod(m.value as any);
                                if (m.value === "crypto") setDonationType("onetime");
                                setShowPaymentOptions(false);
                              }}
                              className={`w-full p-3 text-left hover:bg-muted/50 ${paymentMethod === m.value ? "bg-muted" : ""}`}
                            >
                              <div className="font-medium">{m.label}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {paymentMethod === "bank" && donationType === "onetime" && currency === "JPY" && (
                  <div className="border border-border rounded-lg p-4 bg-muted/50">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">PayPay銀行</span>
                        <button onClick={() => copyToClipboard("PayPay銀行")} className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-xs">
                          <Copy className="w-3 h-3" /> コピー
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>かわせみ支店(007) 普通</span>
                        <button onClick={() => copyToClipboard("007")} className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-xs">
                          <Copy className="w-3 h-3" /> コピー
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>7551963 ツツミマサト</span>
                        <button onClick={() => copyToClipboard("7551963")} className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-xs">
                          <Copy className="w-3 h-3" /> コピー
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "crypto" && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">暗号資産（チェーン選択）</div>
                    <div className="grid grid-cols-2 gap-3">
                      {cryptoChains.map((chain) => (
                        <button
                          key={chain.value}
                          onClick={() => setSelectedChain(chain.value)}
                          className={`p-3 text-left border rounded-lg flex items-center gap-3 ${
                            selectedChain === chain.value ? "bg-muted border-foreground/40" : "hover:bg-muted/50"
                          }`}
                        >
                          <span className={`w-3 h-3 rounded-full ${chain.color}`} />
                          <span className="font-medium text-sm">{chain.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={handlePayment} className="relative z-10 w-full h-12 bg-gray-700 text-white rounded-md font-medium shadow-sm hover:bg-gray-800 inline-flex items-center justify-center gap-2">
                <Heart className="w-4 h-4" /> 寄付する {getDisplayAmount()}
                {donationType === "monthly" ? "（月）" : ""}
              </button>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-12">
          <div className="container mx-auto px-0 max-w-4xl text-center mb-10 md:mb-12">
            <h2 className="text-3xl font-bold mb-3">返礼品について</h2>
            <p className="text-base text-muted-foreground">ご寄付に対するお礼として、以下の返礼品（または特典）をご提供します。</p>
          </div>
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6 md:gap-7 place-items-center">
            {/* ロゴ掲載 */}
            <div className="w-full max-w-sm rounded-xl p-6 bg-white/90 shadow-sm ring-1 ring-gray-100 text-center hover:shadow-md transition-shadow space-y-2">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 rounded-md bg-blue-50 text-blue-700"><Globe className="w-6 h-6" /></div>
                <h3 className="font-semibold text-lg">webページへのロゴ掲載</h3>
              </div>
              <p className="text-sm text-muted-foreground">公式サイトのスポンサー欄に掲載</p>
            </div>

            {/* グッズ配送 */}
            <div className="w-full max-w-sm rounded-xl p-6 bg-white/90 shadow-sm ring-1 ring-gray-100 text-center hover:shadow-md transition-shadow space-y-2">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 rounded-md bg-purple-50 text-purple-700"><Shirt className="w-6 h-6" /></div>
                <h3 className="font-semibold text-lg">オリジナルグッズ配送</h3>
              </div>
              <p className="text-sm text-muted-foreground">Tシャツやステッカーなど</p>
            </div>

            {/* イベント参加権 */}
            <div className="w-full max-w-sm rounded-xl p-6 bg-white/90 shadow-sm ring-1 ring-gray-100 text-center hover:shadow-md transition-shadow space-y-2">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 rounded-md bg-emerald-50 text-emerald-700"><Calendar className="w-6 h-6" /></div>
                <h3 className="font-semibold text-lg">イベント参加権</h3>
              </div>
              <p className="text-sm text-muted-foreground">カンファレンス・勉強会への優先参加</p>
            </div>

            {/* Nyx Mate称号/バッジ */}
            <div className="w-full max-w-sm rounded-xl p-6 bg-white/90 shadow-sm ring-1 ring-gray-100 text-center hover:shadow-md transition-shadow space-y-2">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 rounded-md bg-amber-50 text-amber-700"><BadgeCheck className="w-6 h-6" /></div>
                <h3 className="font-semibold text-lg">Nyx Mate称号・バッジの使用</h3>
              </div>
              <p className="text-sm text-muted-foreground">プロフィール/発表資料等で「Nyx Mate」を名乗れます</p>
            </div>
          </div>
        </section>

        {/* Impact */}
        <section className="bg-muted/50 rounded-2xl p-10 md:p-12 mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">あなたの1,000円で、Ethereumをもっと使いやすく安全に</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-7">
            {impactCards.map((card, i) => (
              <button
                key={i}
                onClick={() => {
                  const map: Record<string, string> = { "研究": "research", "ホワイトハッキング": "whitehat", "形式検証": "verification" };
                  setSelectedActivity(map[card.title] || null);
                }}
                className="text-left rounded-xl p-8 bg-white/90 shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 text-foreground mb-4">
                  <div className={`p-2 rounded-md ${["bg-sky-50 text-sky-700","bg-pink-50 text-pink-700","bg-indigo-50 text-indigo-700"][i]}`}>{card.icon}</div>
                  <div className="font-semibold text-lg">{card.title}</div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.desc}
                </p>
              </button>
            ))}
          </div>
        </section>

        {selectedActivity && (
          <ActivityModal activityId={selectedActivity} onClose={() => setSelectedActivity(null)} />
        )}

        {/* 寄付方法＆ツイート セクションは削除（要望） */}

        {/* Transparency */}
        <section className="bg-muted/50 rounded-2xl p-10 mt-0 mb-24 md:mb-28">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-3xl font-bold">資金の使い道はすべて開示します。</h2>
          </div>
          {/* 2カラムの余白・見出しの整合性を調整 */}
          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100 h-full flex flex-col">
              <div className="p-8 border-b border-gray-200 flex items-center gap-2 text-lg font-semibold">
                <PieChart className="w-5 h-5" /> 前年度資金内訳
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="relative w-56 h-56 md:w-64 md:h-64 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="8" strokeDasharray="113 251" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray="75 289" strokeDashoffset="-113" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="38 326" strokeDashoffset="-188" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="8" strokeDasharray="25 339" strokeDashoffset="-226" />
                  </svg>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-sm mb-5">
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-full" />研究費</div><span className="font-semibold">45%</span></div>
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full" />人件費</div><span className="font-semibold">30%</span></div>
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-500 rounded-full" />運営費</div><span className="font-semibold">15%</span></div>
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-full" />リザーブ</div><span className="font-semibold">10%</span></div>
                </div>
                <div className="mt-auto pt-5 md:pt-6">
                  <a href="#" className="inline-flex items-center justify-center w-full h-11 rounded-md border border-gray-200 text-sm font-medium bg-white hover:bg-gray-50">
                    四半期レポート（アーカイブ）
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100 h-full flex flex-col">
              <div className="p-8 border-b border-gray-200 text-lg font-semibold">最新の実績</div>
              <div className="p-8 space-y-3 flex-1">
                {recentUpdates.map((u, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b last:border-b-0">
                    <span className="font-medium">{u.title}</span>
                    <span className="text-sm text-muted-foreground">{u.date}</span>
                  </div>
                ))}
                <div className="pt-2 text-right">
                  <a href="#" className="text-sm text-gray-700 hover:underline">もっと見る</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sponsors: Corporate & Individual（グリッド、非スクロール、ロゴ貼り付け） */}
        <section className="mb-24 md:mb-28">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">多くのメイトがNyxの活動を支えています。</h2>
          </div>
          {/* 法人・個人メイトを単一コンテナに統合 */}
          <div className="rounded-xl p-10 bg-white shadow-sm ring-1 ring-gray-100">
            <div className="grid grid-cols-1 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-center mb-8">法人メイト</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
                  {corporateSponsors.map((c) => (
                    <div key={c.name} className="flex flex-col items-center gap-3">
                      <div className="relative w-20 h-20">
                        {c.logo ? (
                          <Image src={c.logo} alt={c.name} fill className="object-cover rounded-full ring-1 ring-gray-200" />
                        ) : (
                          <div className="w-full h-full bg-muted rounded-full ring-1 ring-gray-200" />
                        )}
                      </div>
                      <div className="text-sm text-center text-foreground/80">{locale === "ja" ? c.jpname : c.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-center mb-8">個人メイト</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
                  {individualSupporters.map((c) => (
                    <div key={c.name} className="flex flex-col items-center gap-3">
                      <div className="relative w-20 h-20">
                        {c.logo ? (
                          <Image src={c.logo} alt={c.name} fill className="object-cover rounded-full ring-1 ring-gray-200" />
                        ) : (
                          <div className="w-full h-full bg-muted rounded-full ring-1 ring-gray-200" />
                        )}
                      </div>
                      <div className="text-sm text-center text-foreground/80">{locale === "ja" ? c.jpname : c.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 寄付者の声 セクションは削除（要望） */}

        {/* Research Partnership */}
        <section className="mb-24 md:mb-28">
          <div className="text-center mb-8 py-4 md:py-6">
            <h2 className="text-3xl font-bold mb-2">研究パートナーを募集しています。</h2>
            <p className="text-muted-foreground">共に未来の技術を築きませんか</p>
          </div>
          <div className="max-w-6xl mx-auto mb-6 px-6 overflow-hidden">
            <div className="marquee flex gap-0">
              <div className="marquee-content flex gap-4">
                {[
                  { label: "分散システム", icon: <Users className="w-4 h-4" /> },
                  { label: "暗号学", icon: <Users className="w-4 h-4" /> },
                  { label: "メカニズムデザイン", icon: <Users className="w-4 h-4" /> },
                  { label: "形式検証", icon: <Lightbulb className="w-4 h-4" /> },
                  { label: "マーケットマイクロストラクチャー", icon: <Users className="w-4 h-4" /> },
                  { label: "制度派経済学", icon: <Users className="w-4 h-4" /> },
                ].map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white ring-1 ring-gray-200 text-sm whitespace-nowrap">
                    {item.icon} {item.label}
                  </span>
                ))}
              </div>
              <div className="marquee-content flex gap-4" aria-hidden>
                {[
                  "分散システム",
                  "暗号学",
                  "メカニズムデザイン",
                  "形式検証",
                  "マーケットマイクロストラクチャー",
                  "制度派経済学",
                ].map((label, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white ring-1 ring-gray-200 text-sm whitespace-nowrap">
                    <Users className="w-4 h-4" /> {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center mt-2">
            <a href="#donation" className="inline-flex items-center gap-2 h-12 px-6 bg-foreground text-white rounded-md font-semibold hover:opacity-90">
              <ExternalLink className="w-4 h-4" /> 研究提案をする
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-10 md:mt-12 mb-24 md:mb-28">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">よくある質問</h2>
            <p className="text-muted-foreground">寄付に関するご質問にお答えします</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {faqData.map((faq, idx) => (
              <div key={idx} className="rounded-md bg-white/90 shadow-sm ring-1 ring-gray-100">
                <button onClick={() => toggleFAQ(idx)} className="w-full p-5 text-left hover:bg-muted/40">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold pr-4 tracking-tight">{faq.question}</h3>
                    {openFAQ === idx ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                {openFAQ === idx && (
                  <div className="px-5 pb-5 border-t border-gray-100"><p className="text-muted-foreground leading-relaxed">{faq.answer}</p></div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-6 md:mb-8">その他のご質問がございましたら、お気軽にお問い合わせください。</p>
            <a href="mailto:contact@nyx.foundation" className="inline-flex items-center gap-2 h-12 px-6 border border-border rounded-md hover:bg-muted/50">
              <ExternalLink className="w-4 h-4" /> お問い合わせフォーム
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
