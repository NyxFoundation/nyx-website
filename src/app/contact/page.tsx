import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Mail, MapPin, Phone, Globe } from "lucide-react";

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
                      ? "〒100-0001 東京都千代田区千代田1-1-1"
                      : "1-1-1 Chiyoda, Chiyoda-ku, Tokyo 100-0001, Japan"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{isJa ? "電話" : "Phone"}</p>
                  <p className="text-muted-foreground">+81-3-1234-5678</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{isJa ? "ウェブサイト" : "Website"}</p>
                  <a
                    href="https://nyx.foundation"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    https://nyx.foundation
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-muted rounded-lg">
              <h3 className="font-semibold mb-3">
                {isJa ? "営業時間" : "Business Hours"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isJa 
                  ? "月曜日〜金曜日: 9:00 - 18:00"
                  : "Monday - Friday: 9:00 AM - 6:00 PM"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isJa 
                  ? "土日祝日: 休業"
                  : "Saturday, Sunday, Holidays: Closed"}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6">
              {isJa ? "お問い合わせフォーム" : "Contact Form"}
            </h2>
            
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  {isJa ? "お名前" : "Name"}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-3 py-2 rounded-xl ring-1 ring-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  {isJa ? "メールアドレス" : "Email"}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-3 py-2 rounded-xl ring-1 ring-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  {isJa ? "件名" : "Subject"}
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="w-full px-3 py-2 rounded-xl ring-1 ring-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  {isJa ? "メッセージ" : "Message"}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  className="w-full px-3 py-2 rounded-xl ring-1 ring-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 resize-none"
                  required
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full px-4 py-2 bg-foreground text-background rounded-xl shadow-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
              >
                {isJa ? "送信" : "Send"}
              </button>
            </form>
            
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
