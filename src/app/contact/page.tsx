import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Mail, MapPin } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Nyx Foundation",
  description: "Get in touch with Nyx Foundation",
  openGraph: {
    title: "Contact | Nyx Foundation",
    description: "Get in touch with Nyx Foundation",
    images: ["/ogp.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact | Nyx Foundation",
    description: "Get in touch with Nyx Foundation",
    images: ["/ogp.png"],
  },
};

export default async function ContactPage() {
  const locale = await getLocale();
  const isJa = locale === "ja";

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Contact</h1>
        <p className="text-xl text-muted-foreground mb-12">
          {isJa 
            ? "お問い合わせ・ご相談はこちらから" 
            : "Get in touch with us"}
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-6">
              {isJa ? "お問い合わせ先" : "Contact Information"}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{isJa ? "メール" : "Email"}</p>
                  <a
                    href="mailto:contact@nyx.foundation"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    contact@nyx.foundation
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{isJa ? "所在地" : "Address"}</p>
                  <p className="text-muted-foreground">
                    {isJa
                      ? "〒113-0033 東京都文京区本郷6丁目26-10 本郷ニューハウジング202号室"
                      : "Hongo New Housing 202, 6-26-10 Hongo, Bunkyo-ku, Tokyo 113-0033, Japan"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6">
              {isJa ? "お問い合わせフォーム" : "Contact Form"}
            </h2>
            
            <ContactForm isJa={isJa} />

            <p className="mt-4 text-sm text-muted-foreground">
              {isJa
                ? "※お問い合わせ内容によっては、回答にお時間をいただく場合がございます。"
                : "* Response time may vary depending on the nature of your inquiry."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
