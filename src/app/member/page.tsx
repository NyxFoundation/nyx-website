"use client";

import Image from "next/image";
import { useState } from "react";


const membersByCategory = {
  All: [
    {
      name: "vita",
      logo: "/residents/vita.jpeg",
      social: "https://x.com/keccak255",
      topics: ["Consensus", "Institutional Economics"],
    },
    {
      name: "gohan",
      logo: "/residents/gohan.jpg",
      social: "https://x.com/grandchildrice",
      topics: ["zkVM", "Whitehat Hacking"],
    },
    {
      name: "Alphaist",
      logo: "/residents/alpha.jpeg",
      social: "https://x.com/0xAlphaist",
      topics: ["MEV", "DeFi", "Market Microstructure"],
    },
    {
      name: "banri",
      logo: "/residents/banri.jpeg",
      social: "https://x.com/banr1_",
      topics: ["Formal Verification"],
    },
    {
      name: "adust",
      logo: "/residents/adust.jpg",
      social: "https://x.com/adust09",
      topics: ["VOLE", "MPC"],
    },
    {
      name: "Hiro",
      logo: "/residents/tei.jpeg",
      social: "https://x.com/82y31",
      topics: ["MEV", "PBS", "Mechanism Design"],
    },
    {
      name: "tomo",
      logo: "/residents/tomo.jpg",
      social: "https://x.com/adachi_tomoki3",
      topics: ["CrossChain", "Interoperability"],
    },
  ],
  CrossChain: [
    {
      name: "tomo",
      logo: "/residents/tomo.jpg",
      social: "https://x.com/adachi_tomoki3",
      topics: ["CrossChain", "Interoperability"],
    },
  ],
  MEV: [
    {
      name: "Alphaist",
      logo: "/residents/alpha.jpeg",
      social: "https://x.com/0xAlphaist",
      topics: ["MEV", "DeFi", "Market Microstructure"],
    },
    {
      name: "Hiro",
      logo: "/residents/tei.jpeg",
      social: "https://x.com/82y31",
      topics: ["MEV", "PBS", "Mechanism Design"],
    },
  ],
  ZK: [
    {
      name: "gohan",
      logo: "/residents/gohan.jpg",
      social: "https://x.com/grandchildrice",
      topics: ["zkVM", "Whitehat Hacking"],
    },
    {
      name: "banri",
      logo: "/residents/banri.jpeg",
      social: "https://x.com/banr1_",
      topics: ["Formal Verification"],
    },
    {
      name: "adust",
      logo: "/residents/adust.jpg",
      social: "https://x.com/adust09",
      topics: ["VOLE", "MPC"],
    },
  ],
};

export default function MemberPage() {
  const [activeTab, setActiveTab] = useState<keyof typeof membersByCategory>("All");

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Member</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Meet the team behind Nyx Foundation
        </p>

        <div className="flex gap-2 mb-8 overflow-x-auto">
          {Object.keys(membersByCategory).map((category) => (
            <button
              key={category}
              onClick={() => setActiveTab(category as keyof typeof membersByCategory)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === category
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {membersByCategory[activeTab].map((member) => (
            <div
              key={member.name}
              className="bg-white border border-border rounded-lg p-6"
            >
              <div className="relative w-24 h-24 mb-4 mx-auto">
                <Image
                  src={member.logo}
                  alt={member.name}
                  fill
                  className="object-cover rounded-full"
                />
              </div>

              <h3 className="text-xl font-semibold text-center mb-3">
                {member.name}
              </h3>

              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {member.topics.map((topic) => (
                  <span
                    key={topic}
                    className="px-3 py-1 text-xs border border-border rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>

              <div className="flex justify-center">
                <a
                  href={member.social}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}