"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

type FormStatus = "idle" | "loading" | "success" | "error";

interface ApplyFormProps {
  locale: string;
  defaultPosition: string;
}

export function ApplyForm({ locale, defaultPosition }: ApplyFormProps) {
  const t = useTranslations("apply");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // suppress unused var – locale kept for future use
  void locale;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (status === "loading") return;

    setStatus("loading");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message =
          typeof body.error === "string" && body.error.length > 0
            ? body.error
            : "Unknown error";
        throw new Error(message);
      }

      setStatus("success");
      form.reset();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-lg font-semibold mb-2">
          {t("successTitle")}
        </p>
        <p className="text-muted-foreground">
          {t("successDescription")}
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="position" className="block text-sm font-medium mb-2">
          {t("position")}
        </label>
        <input
          type="text"
          id="position"
          name="position"
          defaultValue={defaultPosition}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent"
          required
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          {t("name")} <span className="text-red-500">*</span>
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
          {t("email")} <span className="text-red-500">*</span>
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
          {t("social")}
        </label>
        <input
          type="text"
          id="social"
          name="social"
          placeholder="https://"
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="motivation" className="block text-sm font-medium mb-2">
          {t("motivation")} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="motivation"
          name="motivation"
          rows={5}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent resize-none"
          required
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="experience" className="block text-sm font-medium mb-2">
          {t("experience")} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="experience"
          name="experience"
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent resize-none"
          required
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="remarks" className="block text-sm font-medium mb-2">
          {t("remarks")}
        </label>
        <textarea
          id="remarks"
          name="remarks"
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full px-4 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-70 font-medium text-lg"
      >
        {status === "loading" ? t("submitting") : t("submit")}
      </button>

      {status === "error" && (
        <p className="text-sm text-red-600">
          {t("errorMessage")}{" "}
          {errorMessage && (
            <span className="text-xs text-muted-foreground block mt-1">
              {t("errorDetail", { message: errorMessage })}
            </span>
          )}
        </p>
      )}
    </form>
  );
}
