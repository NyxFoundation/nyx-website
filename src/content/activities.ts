export type LocaleKey = "en" | "ja";

export type ActivityText = {
  id: string;
  title: Record<LocaleKey, string>;
  description: Record<LocaleKey, string>;
};

export const activitiesText: ActivityText[] = [
  {
    id: "research",
    title: {
      en: "Research",
      ja: "研究",
    },
    description: {
      en:
        "We conduct cutting-edge research and development in distributed systems and cryptographic technologies. Our work spans from fundamental research to implementation in blockchain, zero-knowledge proofs, and multi-party computation.",
      ja:
        "最先端の分散システムと暗号技術の研究開発を行っています。ブロックチェーン、ゼロ知識証明、マルチパーティ計算などの基礎研究から実装まで幅広く取り組んでいます。",
    },
  },
  {
    id: "whitehat",
    title: {
      en: "Whitehat Hacking",
      ja: "ホワイトハッキング",
    },
    description: {
      en:
        "Contributing to the improvement of digital infrastructure security through discovery and responsible disclosure of security vulnerabilities. We participate in bug bounty programs and conduct independent vulnerability research.",
      ja:
        "セキュリティ脆弱性の発見と責任ある開示を通じて、デジタルインフラストラクチャの安全性向上に貢献しています。バグバウンティプログラムへの参加と独自の脆弱性研究を行っています。",
    },
  },
  {
    id: "verification",
    title: {
      en: "Formal Verification",
      ja: "形式検証",
    },
    description: {
      en:
        "Using mathematical methods to prove the correctness and security of systems. We provide formal verification services for smart contracts, protocols, and cryptographic algorithms.",
      ja:
        "数学的手法を用いてシステムの正確性と安全性を証明します。スマートコントラクト、プロトコル、暗号アルゴリズムの形式検証サービスを提供しています。",
    },
  },
  {
    id: "education",
    title: {
      en: "Education",
      ja: "教育",
    },
    description: {
      en:
        "Committed to nurturing the next generation of researchers and engineers. We share cutting-edge technical knowledge through workshops, seminars, and online courses.",
      ja:
        "次世代の研究者とエンジニアの育成に取り組んでいます。ワークショップ、セミナー、オンラインコースを通じて、最新の技術知識を共有しています。",
    },
  },
  {
    id: "house",
    title: {
      en: "House",
      ja: "ハウス",
    },
    description: {
      en:
        "Operating a community space for researchers and innovators. We provide a physical hub for idea exchange, collaboration, and experimentation.",
      ja:
        "研究者とイノベーターのためのコミュニティスペースを運営しています。アイデアの交換、コラボレーション、実験のための物理的な拠点を提供しています。",
    },
  },
];

export function getActivityText(id: string, locale: LocaleKey) {
  const item = activitiesText.find((a) => a.id === id);
  if (!item) return { title: "", description: "" };
  return {
    title: item.title[locale],
    description: item.description[locale],
  };
}

