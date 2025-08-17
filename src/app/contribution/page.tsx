"use client";

import { useTranslations, useLocale } from "next-intl";
import { Users, Gift, Package, Wallet, Heart } from "lucide-react";
import { Tweet } from "react-tweet";
import Image from "next/image";

export default function ContributionPage() {
  const t = useTranslations("contribution");
  const locale = useLocale();

  // Contributor data - all contributors in a flat list
  const contributors = [
    { name: "Ethereum Foundation", jpname: "イーサリアム財団", logo: "/sponsors/ef.jpg" },
    { name: "Geodework", jpname: "ジオデワーク", logo: "/sponsors/geodework.jpg" },
    { name: "Polygon", jpname: "ポリゴン", logo: "/sponsors/polygon.jpeg" },
    { name: "GuildQB", jpname: "ギルドQB", logo: "/sponsors/guildqb.png" },
    { name: "KIRIFUDA Inc.", jpname: "キリフダ株式会社", logo: "/sponsors/kirifuda.jpg" },
    { name: "DeSci Tokyo", jpname: "デサイ東京", logo: "/sponsors/desci.jpg" },
    { name: "chikeo", jpname: "チケ男", logo: "/sponsors/ticket.jpg" },
    { name: "KIMINORI JAPAN", jpname: "キミノリ・ジャパン", logo: "/sponsors/kiminorijapan.jpg" },
    { name: "Hiro Shimo", jpname: "志茂 博", logo: "/sponsors/shimo.jpg" },
    { name: "Anonymous", jpname: "匿名希望", logo: null },
  ];

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {t("title")}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Contribution Methods */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <Gift className="w-10 h-10 mb-4 text-blue-600" />
            <h3 className="text-xl font-semibold mb-3">
              {t("contributionMethods.donation.title")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t("contributionMethods.donation.description")}
            </p>
            <a href="#donation" className="text-blue-600 hover:underline">
              {t("contributionMethods.donation.viewMethods")}
            </a>
          </div>

          <div className="border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <Users className="w-10 h-10 mb-4 text-green-600" />
            <h3 className="text-xl font-semibold mb-3">
              {t("contributionMethods.collaboration.title")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t("contributionMethods.collaboration.description")}
            </p>
            <a href="#collaboration" className="text-blue-600 hover:underline">
              {t("contributionMethods.collaboration.viewDetails")}
            </a>
          </div>

          <div className="border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <Heart className="w-10 h-10 mb-4 text-purple-600" />
            <h3 className="text-xl font-semibold mb-3">
              {t("contributionMethods.sponsor.title")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t("contributionMethods.sponsor.description")}
            </p>
            <a href="#sponsors" className="text-blue-600 hover:underline">
              {t("contributionMethods.sponsor.viewDetails")}
            </a>
          </div>

        </div>

        {/* Current Sponsors */}
        <section id="sponsors" className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t("sponsors.title")}
          </h2>

          {/* Horizontal scrolling container */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {contributors.map((contributor) => (
                <div
                  key={contributor.name}
                  className="flex-shrink-0 border border-border rounded-lg p-6 text-center hover:bg-muted/50 transition-colors"
                  style={{ minWidth: "180px" }}
                >
                  <div className="mb-3 flex justify-center">
                    {contributor.logo ? (
                      <div className="relative w-16 h-16">
                        <Image
                          src={contributor.logo}
                          alt={contributor.name}
                          fill
                          className="object-cover rounded-full"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-2xl">
                        🤫
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm">{locale === "ja" ? contributor.jpname : contributor.name}</h4>
                </div>
              ))}
            </div>
          </div>
          
          {/* Sponsor Contact Info */}
          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              {t("sponsors.contact")} 
              <a href="mailto:kingmasatojames@gmail.com" className="text-blue-600 hover:underline ml-1">
                kingmasatojames(at)gmail.com
              </a>
            </p>
          </div>
        </section>

        {/* Donation Section */}
        <section id="donation" className="mb-16">
          <h2 className="text-2xl font-bold mb-6">
            {t("howToDonate.title")}
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* ERC20 Address */}
            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5" />
                <h3 className="font-semibold">
                  {t("howToDonate.erc20.title")}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t("howToDonate.erc20.description")}
              </p>
              <code className="block p-3 bg-muted rounded text-xs break-all">
                0xa1a8d76A0044ce9d8aeF7c5279111a3029f58a6a
              </code>
            </div>

            {/* Amazon Wish List */}
            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5" />
                <h3 className="font-semibold">
                  {t("howToDonate.wishList.title")}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t("howToDonate.wishList.description")}
              </p>
              <a
                href="https://www.amazon.jp/hz/wishlist/ls/16QCGM9CJ1NL5?ref_=wl_share"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-purple-600 !text-white font-semibold rounded-md hover:bg-purple-700 hover:!text-white transition-colors text-sm hover:no-underline"
              >
                {t("howToDonate.wishList.button")}
                <span className="ml-2">→</span>
              </a>
            </div>
          </div>

          {/* Example Thank You Tweet */}
          <div className="bg-muted/50 rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-4">
              {t("howToDonate.thankYouNote")}
            </p>
            <div className="flex justify-center">
              <Tweet id="1952571953610653903" />
            </div>
          </div>
        </section>

        {/* Collaboration Section */}
        <section id="collaboration" className="mb-16">
          <h2 className="text-2xl font-bold mb-6">
            {t("collaboration.title")}
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="mb-4">
              {t("collaboration.intro")}
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>
                <strong>{t("collaboration.areas.formalVerification.title")}:</strong>{" "}
                {t("collaboration.areas.formalVerification.description")}
              </li>
              <li>
                <strong>{t("collaboration.areas.zkProofs.title")}:</strong>{" "}
                {t("collaboration.areas.zkProofs.description")}
              </li>
              <li>
                <strong>{t("collaboration.areas.distributedSystems.title")}:</strong>{" "}
                {t("collaboration.areas.distributedSystems.description")}
              </li>
              <li>
                <strong>{t("collaboration.areas.cryptoeconomics.title")}:</strong>{" "}
                {t("collaboration.areas.cryptoeconomics.description")}
              </li>
            </ul>
            <p>
              {t("collaboration.contact")}{" "}
              <a href="mailto:kingmasatojames@gmail.com" className="text-blue-600 hover:underline">
                kingmasatojames(at)gmail.com
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}