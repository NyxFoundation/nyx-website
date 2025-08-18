export type LocaleKey = "en" | "ja";

export type ActivityText = {
  id: string;
  title: Record<LocaleKey, string>;
  description: Record<LocaleKey, string>;
};

export type ActivityDetailItem = {
  image: string; // path under public/
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

// Optional per-activity rich details to show in the modal
export const activitiesDetails: Record<string, ActivityDetailItem[]> = {
  research: [
    {
      image: "/activity/zkvm.png",
      title: {
        en: "Benchmarking zkVM",
        ja: "zkVMのベンチマーク",
      },
      description: {
        en: "Benchmarked the performance of zkVM and presented at ZKProof7.",
        ja: "zkVMの性能を評価するためのベンチマークを行い、ZKProof7で発表しました。",
      },
    },
  ],
  whitehat: [
    {
      image: "/activity/reth.png",
      title: {
        en: "Reth",
        ja: "Reth",
      },
      description: {
        en: "Contributed to the Reth Ethereum client with three implementation improvements.",
        ja: "イーサリアムクライアント「Reth」の実装を改善しました。",
      },
    },
    {
      image: "/activity/geth.png",
      title: {
        en: "Geth",
        ja: "Geth",
      },
      description: {
        en: "Contributed to fixing a DoS attack vector in the Geth Ethereum client GraphQL endpoint.",
        ja: "イーサリアムクライアント「Geth」のGraphQLエンドポイントに残っていたDoS攻撃ベクタを修正しました。",
      },
    },
    {
      image: "/activity/erigon.png",
      title: {
        en: "Erigon",
        ja: "Erigon",
      },
      description: {
        en: "Contributed to fixing a DoS attack vector in the Erigon Ethereum client WebSocket endpoint.",
        ja: "イーサリアムクライアント「Erigon」のWebSocketエンドポイントに残っていたDoS攻撃ベクタを修正しました。",
      },
    },
    {
      image: "/activity/intmax.png",
      title: {
        en: "Intmax",
        ja: "Intmax",
      },
      description: {
        en: "Discovered a copy-paste bug in zkRollup's Intmax zero-knowledge proof implementation and reported it through ImmuneFi.",
        ja: "zkRollupのIntmaxのゼロ知識証明実装にあったコピーペーストバグを発見し、ImmuneFiを通じて報告しました。",
      },
    },
  ],
  verification: [
    {
      image: "/math.png",
      title: {
        en: "Coming soon",
        ja: "近日公開予定",
      },
      description: {
        en: "",
        ja: "",
      },
    },
  ],
  education: [
    {
      image: "/ogp.png",
      title: {
        en: "YouTube",
        ja: "YouTube",
      },
      description: {
        en: "We publish educational videos on Ethereum on our official Nyx YouTube channel.",
        ja: "Nyx公式YouTubeチャンネルでイーサリアムに関する勉強会の動画を公開しています。",
      },
    },
    {
      image: "/activity/zktokyo.png",
      title: {
        en: "ZK Tokyo",
        ja: "ZK Tokyo",
      },
      description: {
        en: "We organize the periodic event 'ZK Tokyo' focused on zero-knowledge proofs and the educational program 'ZK Core Program' for implementing zero-knowledge proofs.",
        ja: "不定期でゼロ知識証明に関するイベント「ZK Tokyo」やゼロ知識証明実装に関する教育プログラム「ZK Core Program」を運営しています。",
      },
    },
  ],
  house: [
    {
      image: "/house.png",
      title: {
        en: "Nyx House",
        ja: "Nyxハウス",
      },
      description: {
        en: "A share house for researchers in Tokyo, serving as a hub for companies and researchers. Open to the public after 7pm daily.",
        ja: "東京にある研究者のためのシェアハウスで、企業や研究者のハブとなる場所です。毎日7pm以降は一般開放しています。",
      },
    },
  ],
};

export function getActivityDetails(id: string, locale: LocaleKey) {
  const items = activitiesDetails[id] || [];
  return items.map((it) => ({
    image: it.image,
    title: it.title[locale],
    description: it.description[locale],
  }));
}
