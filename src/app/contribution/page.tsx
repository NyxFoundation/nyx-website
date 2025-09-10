"use client";

import { useTranslations, useLocale } from "next-intl";
import { ExternalLink, Heart, PieChart, Users, Lightbulb, ChevronDown, ChevronUp, Copy, BookOpen, ShieldCheck, FunctionSquare, Globe, Shirt, Calendar, BadgeCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ActivityModal } from "@/components/activity/ActivityModal";

export default function ContributionPage() {
  const t = useTranslations("contribution");
  const locale = useLocale();

  // Donation UI state (one-time only, default crypto)
  const [selectedAmount, setSelectedAmount] = useState("0.1");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedChain, setSelectedChain] = useState("ethereum");
  const [selectedMethod, setSelectedMethod] = useState<"ETH" | "USDC" | "USDT" | "DAI" | "JPY">("ETH");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<null | { id: string; name: string; role: string; avatar?: string; bio?: string }>(null);

  const cryptoAmountValues = ["0.01", "0.1", "1", "3", "5", "10"] as const;
  const jpyAmountValues = ["1000", "2000", "3000", "5000", "10000", "20000"] as const;

  const cryptoChains = [
    { value: "ethereum", label: "Ethereum", color: "bg-gray-500" },
    { value: "optimism", label: "Optimism", color: "bg-red-500" },
    { value: "arbitrum", label: "Arbitrum", color: "bg-blue-500" },
    { value: "base", label: "Base", color: "bg-sky-500" },
  ];

  const paymentOptions = [
    { value: "ETH", label: "ETH", type: "crypto" as const, chain: "Ethereum" },
    { value: "USDC", label: "USDC", type: "crypto" as const, chain: "Multi-chain" },
    { value: "USDT", label: "USDT", type: "crypto" as const, chain: "Multi-chain" },
    { value: "DAI", label: "DAI", type: "crypto" as const, chain: "Ethereum" },
    { value: "JPY", label: "JPY (銀行振込)", type: "fiat" as const },
  ];

  // Team members (fill with real data and avatars under public/team)
  const teamMembers = [
    { id: "vita", name: "vita", role: "Consensus / MEV", avatar: "/residents/vita.jpeg", bio: "Consensus and MEV research, protocol direction." },
    { id: "gohan", name: "gohan", role: "zkVM / Whitehat", avatar: "/residents/gohan.jpg", bio: "zkVM research and whitehat security contributions." },
    { id: "alpha", name: "Alphaist", role: "MEV / DeFi", avatar: "/residents/alpha.jpeg", bio: "MEV, DeFi, and market microstructure." },
    { id: "banri", name: "banri", role: "Formal Verification", avatar: "/residents/banri.jpeg", bio: "Specs, proofs, and verification tooling." },
    { id: "adust", name: "adust", role: "VOLE / MPC", avatar: "/residents/adust.jpg", bio: "MPC and VOLE implementations." },
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
    {
      question: "Nyx Foundationは非営利法人ですか？",
      answer:
        "はい、Nyx Foundationは非営利型の一般社団法人という法人格を有しています。利益分配を目的とせず、剰余金は研究開発・形式検証・コミュニティへの貢献など当団体の目的に再投資されます。理事・社員への配当は行いません。",
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
      answer:
        "可能です。研究パートナーシップやスポンサーシップのプログラムをご用意しています。まずはお問い合わせフォームからご相談ください。",
    },
    {
      question: "寄付者特典はいつ受け取れますか？",
      answer:
        "ロゴ掲載は寄付確認後1週間以内、グッズ配送は月末締めで翌月発送、イベント参加権は開催1か月前にご案内、バッジ（Nyx Mate）は確認後に順次ご案内します。",
    },
  ];

  const isFiatJPY = selectedMethod === "JPY";

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const handleMethodChange = (method: "ETH" | "USDC" | "USDT" | "DAI" | "JPY") => {
    setSelectedMethod(method);
    if (method === "JPY") {
      setSelectedAmount("3000");
    } else {
      setSelectedAmount("0.1");
    }
    setCustomAmount("");
  };

  // method drives UI; no side-effects required
  useEffect(() => {}, []);

  const getDisplayAmount = () => {
    if (selectedAmount === "custom") {
      if (!isFiatJPY) return customAmount ? `${customAmount} ${selectedMethod}` : `0 ${selectedMethod}`;
      return customAmount ? `${Number.parseInt(customAmount).toLocaleString()}円` : "0円";
    }
    if (!isFiatJPY) {
      const val = cryptoAmountValues.find(v => v === (selectedAmount as any));
      return val ? `${val} ${selectedMethod}` : `0 ${selectedMethod}`;
    } else {
      const val = jpyAmountValues.find(v => v === (selectedAmount as any));
      return val ? `${Number.parseInt(val).toLocaleString()}円` : "0円";
    }
  };

  const toggleFAQ = (idx: number) => setOpenFAQ(openFAQ === idx ? null : idx);

  const handlePayment = () => {
    alert(`支払いページに移動します: ${getDisplayAmount()} 今回のみ`);
  };

  return (
    <div className="min-h-screen px-4 pt-10 md:pt-12 pb-20 md:pb-24">
      <div className="container mx-auto max-w-6xl">
        {/* Hero with Donation Card */}
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 md:gap-14 items-center mb-20">
          <div className="space-y-4 md:space-y-5">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              {locale === "ja" ? (
                <>Ethereumをもっと安全に。</>
              ) : (
                <>
                  Make Ethereum safer.
                </>
              )}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              <span className="font-semibold">「オープンイノベーションのための検証可能な未来を築く」</span>というビジョンの下、分散システムや暗号技術の研究開発を行っています。寄付を通じて我々の活動を支援することができます。寄付額は自由です。
            </p>
            {/* サブスク文言は削除（今回のみの寄付に統一） */}
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                <Users className="w-4 h-4" /> 法人の方はこちら
              </Link>
            </div>
          </div>

          <div className="rounded-xl px-7 pt-5 pb-5 bg-white shadow-sm ring-1 ring-gray-100">
            <div className="space-y-4 md:space-y-5">
              {/* 支払い方法 */}
              <div className="space-y-2">
                <div className="text-sm font-medium">支払い方法</div>
                <div className="relative">
                  <button
                    onClick={() => setShowPaymentOptions((s) => !s)}
                    className="w-full p-4 text-left border rounded-lg bg-white flex items-center justify-between hover:bg-muted/50"
                  >
                    <span className="font-medium">{paymentOptions.find(o => o.value === selectedMethod)?.label || "選択してください"}</span>
                    <span className="text-xs text-muted-foreground">{showPaymentOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
                  </button>
                  {showPaymentOptions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow z-20">
                      {paymentOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSelectedMethod(opt.value);
                            setSelectedAmount(opt.value === "JPY" ? "3000" : "0.1");
                            setShowPaymentOptions(false);
                          }}
                          className={`w-full p-3 text-left hover:bg-muted/50 ${selectedMethod === opt.value ? "bg-muted" : ""}`}
                        >
                          <div className="font-medium">{opt.label}</div>
                          {opt.type === "crypto" && <div className="text-xs text-muted-foreground">{opt.chain}</div>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 金額を選択 */}
              <div className="space-y-3 md:space-y-4">
                <div className="text-sm font-medium">金額を選択</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-3.5">
                  {(selectedMethod === "JPY" ? jpyAmountValues : cryptoAmountValues).map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setSelectedAmount(val);
                        setCustomAmount("");
                      }}
                      className={`py-3 px-3 text-center border rounded-lg transition-all ${
                        selectedAmount === val ? "border-gray-400 bg-gray-50" : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="font-medium text-sm md:text-base">{selectedMethod === "JPY" ? `${Number.parseInt(val).toLocaleString()}円` : `${val} ${selectedMethod}`}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedAmount("custom")}
                  className={`w-full py-3 px-3 text-center border rounded-lg transition-all ${
                    selectedAmount === "custom" ? "border-gray-400 bg-gray-50" : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="font-medium text-base">カスタム</div>
                  {selectedAmount === "custom" && (
                    <input
                      type="number"
                      placeholder={selectedMethod === "JPY" ? "50000" : "0.1"}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="mt-2 w-full border border-gray-300 rounded px-3 py-2 text-center"
                      min={selectedMethod === "JPY" ? 500 : 0.001}
                      step={selectedMethod === "JPY" ? 100 : 0.001}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </button>
              </div>

              {/* 銀行振込（JPY） or チェーン選択（暗号資産） */}
              {selectedMethod === "JPY" ? (
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
              ) : (
                <div className="space-y-2">
                  <div className="text-sm font-medium">チェーン</div>
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

              <button onClick={handlePayment} className="relative z-10 w-full h-12 bg-gray-700 text-white rounded-md font-medium shadow-sm hover:bg-gray-800 inline-flex items-center justify-center gap-2">
                <Heart className="w-4 h-4" /> 寄付する {getDisplayAmount()}
              </button>
            </div>
          </div>
        </section>

        {/* Story - Part 1: 安全なEthereumがもたらす世界 */}
        <section className="bg-muted/50 rounded-2xl p-8 md:p-10 mb-6">
          {locale === "ja" ? (
            <div className="max-w-6xl mx-auto space-y-8 md:space-y-10">
              <h2 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">安全なEthereumがもたらす世界</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-7 md:gap-9 items-center">
                <div className="order-2 md:order-2 lg:col-span-7 self-center space-y-4 text-[15px] md:text-base text-muted-foreground leading-relaxed">
                  <p>仕様と実装が整合し、状態遷移と資産移転が期待どおりに一貫して実行され、第三者が検証できる——私たちのいう「安全」は、そんな土台から始まります。</p>
                  <p>この基盤の上で動くスマートコントラクトは、信頼を特定の主体に預けず、約束をコード化し、履行まで検証可能にします。だからこそ、過剰な仲介は最小化され、市場支配が生む非効率は抑えられ、参入障壁は下がる。結果として、世界中の誰もが、公平なルールの上で新しい価値を試し、組み合わせ、広げていける——私たちはそのための基盤に貢献します。</p>
                </div>
                <div className="order-1 md:order-1 lg:col-span-5">
                  <div className="relative w-full aspect-[16/9] md:aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-sm">
                    <img
                      src="https://ethereum.org/_next/static/media/learn-hub-hero.bc4653ed.png"
                      alt="安全なEthereumのビジュアル"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8 md:space-y-10">
              <h2 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">How a safer Ethereum changes the world</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-7 md:gap-9 items-center">
                <div className="order-2 md:order-1 lg:col-span-7 self-center space-y-4 text-[15px] md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    Smart contracts shift trust away from institutions to code and verifiable procedure. A safer Ethereum means specs and implementations in alignment, with state transitions and value transfers behaving as intended. This is not merely technical; it lifts social coordination and economic activity toward transparency and reproducibility. Fewer vulnerabilities, better gas efficiency, and stronger verification tools raise predictability for users and structurally reduce losses from scams and bugs.
                  </p>
                  <p>
                    Bringing “code keeps promises” closer to reality is the core of safety. Verifiability lets anyone build, compose, and extend under the same rules. Safety is the foundation of creativity.
                  </p>
                </div>
                <div className="order-1 md:order-2 lg:col-span-5">
                  <div className="relative w-full aspect-[16/9] md:aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-sm">
                    <img
                      src="https://ethereum.org/_next/static/media/learn-hub-hero.bc4653ed.png"
                      alt="Safer Ethereum visual"
                      className="w-full h-full object-cover"
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
                      <img src={selectedMember.avatar} alt={selectedMember.name} className="w-10 h-10 object-cover rounded-full ring-1 ring-gray-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted ring-1 ring-gray-200" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{selectedMember.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedMember.role}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} className="text-sm text-muted-foreground hover:text-foreground">閉じる</button>
              </div>
              <div className="p-5">
                <p className="text-sm leading-relaxed text-foreground/80">{selectedMember.bio || "プロフィール情報は準備中です。"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Roadmap: 何をするか（タイトルのみ変更） */}
        <section className="bg-muted/50 rounded-2xl p-8 md:p-10 mb-6">
          {locale === "ja" ? (
            <div className="max-w-6xl mx-auto space-y-8">
              <h3 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">何をするか</h3>

              {/* Stepper */}
              <div className="relative">
                <div className="absolute left-0 right-0 top-4 h-[2px] bg-gray-200" />
                <ol className="relative z-10 grid grid-cols-3 gap-4">
                  {[
                    { label: "Now", desc: "着手中", color: "bg-emerald-500" },
                    { label: "Next", desc: "次に着手", color: "bg-amber-500" },
                    { label: "Future", desc: "将来", color: "bg-gray-400" },
                  ].map((s) => (
                    <li key={s.label} className="flex flex-col items-center text-center">
                      <span className={`w-3.5 h-3.5 rounded-full ring-4 ring-white ${s.color}`} />
                      <span className="mt-2 text-sm font-medium">{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.desc}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Phase Cards */}
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-md bg-emerald-50 text-emerald-700"><ShieldCheck className="w-5 h-5" /></div>
                    <h4 className="font-semibold">Now: 安全性と実装整合</h4>
                  </div>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>クライアント・アプリケーションへのバグ修正・性能改善</li>
                    <li>leanConsensusの研究開発・形式検証</li>
                    <li>形式検証の自動証明ツールのPoC開発</li>
                  </ul>
                </div>
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-md bg-amber-50 text-amber-700"><FunctionSquare className="w-5 h-5" /></div>
                    <h4 className="font-semibold">Next: 検証の自動化と拡張</h4>
                  </div>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>新規クライアントの開発や貢献</li>
                    <li>leanConsensusのより広い研究開発・形式検証</li>
                    <li>形式証明エージェントのスコープ拡大と洗練</li>
                  </ul>
                </div>
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-md bg-sky-50 text-sky-700"><Lightbulb className="w-5 h-5" /></div>
                    <h4 className="font-semibold">Future: 検証が前提のエコシステムへ</h4>
                  </div>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>暗号学的なクライアントの確立</li>
                    <li>leanEthereumの実装とその貢献</li>
                    <li>EIPに形式仕様を組み込み、Spec≡Implを標準化</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8">
              <h3 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">What We Will Do</h3>

              <div className="relative">
                <div className="absolute left-0 right-0 top-4 h-[2px] bg-gray-200" />
                <ol className="relative z-10 grid grid-cols-3 gap-4">
                  {[
                    { label: "Now", desc: "In progress", color: "bg-emerald-500" },
                    { label: "Next", desc: "Up next", color: "bg-amber-500" },
                    { label: "Future", desc: "Future", color: "bg-gray-400" },
                  ].map((s) => (
                    <li key={s.label} className="flex flex-col items-center text-center">
                      <span className={`w-3.5 h-3.5 rounded-full ring-4 ring-white ${s.color}`} />
                      <span className="mt-2 text-sm font-medium">{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.desc}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-md bg-emerald-50 text-emerald-700"><ShieldCheck className="w-5 h-5" /></div>
                    <h4 className="font-semibold">Now: Safety & Spec Alignment</h4>
                  </div>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Bug fixes and perf improvements in clients</li>
                    <li>Spec reviews, test additions, and regression guards</li>
                    <li>Verification tooling (properties/fuzzing) hardening</li>
                  </ul>
                </div>
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-md bg-amber-50 text-amber-700"><FunctionSquare className="w-5 h-5" /></div>
                    <h4 className="font-semibold">Next: Formal Methods & Tooling</h4>
                  </div>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Property definitions and proof sketches for key parts</li>
                    <li>Model checking and differential verification pipelines</li>
                    <li>Auditing checklist and automation scripts (open)</li>
                  </ul>
                </div>
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-md bg-sky-50 text-sky-700"><Lightbulb className="w-5 h-5" /></div>
                    <h4 className="font-semibold">Future: Verification-first ecosystem</h4>
                  </div>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Experiments and proposals around MEV and PBS</li>
                    <li>Ongoing notes, videos, and workshops</li>
                    <li>Broader collaborations and grants</li>
                  </ul>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">Roadmap is reviewed and updated quarterly.</p>
            </div>
          )}
        </section>

        {/* Team & Achievements section */}
        <section className="bg-muted/50 rounded-2xl p-8 md:p-10 mb-6">
          {locale === "ja" ? (
            <div className="max-w-6xl mx-auto space-y-8 md:space-y-10">
              <h3 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">チームと実績</h3>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <h4 className="font-semibold mb-3">チーム</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {teamMembers.map((m) => (
                      <button key={m.id} onClick={() => setSelectedMember(m)} className="flex flex-col items-center gap-2 group">
                        <div className="relative w-16 h-16">
                          {m.avatar ? (
                            <img src={m.avatar} alt={m.name} className="w-16 h-16 object-cover rounded-full ring-1 ring-gray-200" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-muted ring-1 ring-gray-200" />
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
                    {recentUpdates.slice(0,5).map((u, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <span className="text-sm font-medium">{u.title}</span>
                        <span className="text-xs text-muted-foreground">{u.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8 md:space-y-10">
              <h3 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">Team & Achievements</h3>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="rounded-xl p-5 bg-white/90 shadow-sm ring-1 ring-gray-100">
                  <h4 className="font-semibold mb-2">Team</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {teamMembers.map((m) => (
                      <button key={m.id} onClick={() => setSelectedMember(m)} className="flex flex-col items-center gap-2 group">
                        <div className="relative w-16 h-16">
                          {m.avatar ? (
                            <img src={m.avatar} alt={m.name} className="w-16 h-16 object-cover rounded-full ring-1 ring-gray-200" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-muted ring-1 ring-gray-200" />
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
                    {recentUpdates.slice(0,5).map((u, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <span className="text-sm font-medium">{u.title}</span>
                        <span className="text-xs text-muted-foreground">{u.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Story - Part 2: 私たちがやる理由 */}
        <section className="bg-muted/50 rounded-2xl p-8 md:p-10 mb-6">
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
                    <img src="/gallery/activities-hero.jpg" alt="私たちの活動の様子" className="w-full h-full object-cover" />
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
                    <img src="/gallery/activities-hero.jpg" alt="Our team and work" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
              {/* Team & Achievements moved to its own section above */}
            </div>
          )}
        </section>

        {/* Story - Part 3: Nyx Mateについて */}
        <section className="bg-muted/50 rounded-2xl p-8 md:p-10 mb-12">
          {locale === "ja" ? (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="max-w-6xl mx-auto space-y-3">
                <h3 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">Nyx Mateについて</h3>
                <p className="text-base text-muted-foreground leading-relaxed">Nyx Foundationの価値観に共感し、Nyxの活動を前に進めるお手伝いをしてくださる方々をNyx Mateと呼んでいます。Nyx Mateからのご支援は、「検証が前提」のエコシステムと、公平なルールの上で価値が広がる世界への一歩になります。</p>
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
                      <h5 className="font-semibold">Nyx Mate称号・バッジの使用</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">プロフィール/発表資料等で「Nyx Mate」を名乗れます</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="max-w-6xl mx-auto space-y-3">
                <h3 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">How your support is used</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Your gift funds client and protocol contributions, vulnerability research and fixes, gas optimizations, formal verification (specs, proofs, tooling), and applied research in mechanism design. Small PRs and single proofs prevent incidents over time and raise reliability across the ecosystem.
                </p>
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
                      <h5 className="font-semibold">Nyx Mate badge</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">Use “Nyx Mate” on profiles and slides</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Impact section removed; merged conceptually into reasons */}

        {/* 寄付方法＆ツイート セクションは削除（要望） */}

        {/* Achievements section removed as requested */}

        {/* Benefits section moved into “ご支援の使い道” */}

        {/* Sponsors: Corporate & Individual（グリッド、非スクロール、ロゴ貼り付け） */}
        <section className="mb-24 md:mb-28">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold whitespace-nowrap">多くのメイトがNyxの活動を支えています。</h2>
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
          </div>
        </section>

        {/* 寄付者の声 セクションは削除（要望） */}

        {/* Research Partnership section removed */}

        {/* FAQ */}
        <section className="mt-10 md:mt-12 mb-24 md:mb-28">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 whitespace-nowrap">よくある質問</h2>
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
          </div>
        </section>
      </div>
    </div>
  );
}
