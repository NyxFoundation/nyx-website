"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getActivityDetails,
  getActivityText,
  type LocaleKey,
} from "@/content/activities";

interface ActivityModalProps {
  activityId: string;
  onClose: () => void;
}

export function ActivityModal({ activityId, onClose }: ActivityModalProps) {
  const tCommon = useTranslations("common");
  const locale = (useLocale() as LocaleKey) || "en";

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-in fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50",
            // Wider modal while keeping good mobile fit
            "w-[92vw] sm:w-[90vw] max-w-3xl lg:max-w-5xl max-h-[85vh]",
            "translate-x-[-50%] translate-y-[-50%]",
            "bg-white border border-border rounded-lg shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
            "overflow-y-auto"
          )}
        >
          <div className="p-6 md:p-8">
            <Dialog.Title className="text-3xl md:text-4xl font-bold mb-3">
              {getActivityText(activityId, locale).title}
            </Dialog.Title>

            <Dialog.Description className="text-base md:text-lg leading-relaxed text-muted-foreground mb-6">
              {getActivityText(activityId, locale).description}
            </Dialog.Description>

            <div className="grid grid-cols-1 gap-6 border-t pt-4 border-gray-400">
              {getActivityDetails(activityId, locale).map((item, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-4 md:gap-6 border-b border-gray-400 pb-4">
                  <div className="relative w-full md:w-48 lg:w-56 h-40 md:h-36 lg:h-40 flex-none overflow-hidden rounded-lg">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 320px, 360px"
                      className="object-contain object-center rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <h4 className="font-semibold text-xl mb-2">
                      {item.title}
                    </h4>
                    <p className="text-[15px] md:text-base text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <Dialog.Close asChild>
                <button
                  className={cn(
                    "inline-flex items-center justify-center",
                    "px-4 py-2 text-sm font-medium",
                    "bg-foreground text-background rounded-md",
                    "hover:bg-opacity-90 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2"
                  )}
                >
                  {tCommon("close")}
                </button>
              </Dialog.Close>
            </div>
          </div>

          <Dialog.Close asChild>
            <button
              className={cn(
                "absolute right-4 top-4",
                "inline-flex h-8 w-8 items-center justify-center rounded-sm",
                "hover:bg-muted transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-offset-2"
              )}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
