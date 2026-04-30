"use client";

import { FormEvent, useState } from "react";
import { HONEYPOT_FIELD } from "@/lib/spam-protection";

type FormStatus = "idle" | "loading" | "success" | "error";

interface ContactFormProps {
  isJa: boolean;
}

export function ContactForm({ isJa }: ContactFormProps) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (status === "loading") return;
    if (!agreed) return;

    setStatus("loading");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message = typeof body.error === "string" && body.error.length > 0 ? body.error : "Unknown error";
        throw new Error(message);
      }

      setStatus("success");
      form.reset();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Honeypot — must remain empty */}
      <input
        type="text"
        name={HONEYPOT_FIELD}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] w-px h-px overflow-hidden"
      />
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          {isJa ? "お名前" : "Name"}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent"
          required
          aria-required="true"
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
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent"
          required
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="social" className="block text-sm font-medium mb-2">
          {isJa ? "ソーシャルメディア（URL任意）" : "Social media (optional URL)"}
        </label>
        <input
          type="url"
          id="social"
          name="social"
          placeholder="https://"
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          {isJa ? "お問い合わせ内容" : "Message"}
        </label>
        <textarea
          id="content"
          name="content"
          rows={6}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent resize-none"
          required
          aria-required="true"
        ></textarea>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-3">
        <label htmlFor="not-sales" className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            id="not-sales"
            name="notSales"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-foreground"
            required
            aria-required="true"
          />
          <span className="text-muted-foreground">
            {isJa
              ? "本問い合わせはマーケティング・PR・営業・採用支援等の営業連絡ではないことに同意します。"
              : "I confirm that this inquiry is not a sales/marketing, PR, or recruiting solicitation."}
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={status === "loading" || !agreed}
        className="w-full px-4 py-2 bg-foreground text-background rounded-md hover:bg-opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {status === "loading"
          ? isJa ? "送信中..." : "Sending..."
          : isJa ? "送信" : "Send"}
      </button>

      {status === "success" && (
        <p className="text-sm text-emerald-600">
          {isJa ? "送信が完了しました。折り返しのご連絡をお待ちください。" : "Message sent. We'll get back to you soon."}
        </p>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600">
          {isJa ? "送信に失敗しました。" : "Failed to send."}{" "}
          {errorMessage && (
            <span className="text-xs text-muted-foreground block mt-1">
              {isJa ? `詳細: ${errorMessage}` : `Details: ${errorMessage}`}
            </span>
          )}
        </p>
      )}
    </form>
  );
}
