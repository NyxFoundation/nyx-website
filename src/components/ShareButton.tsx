"use client";

import { FC } from "react";
import { Share2 } from "lucide-react";

interface ShareButtonProps {
  title: string;
  label: string;
}

export const ShareButton: FC<ShareButtonProps> = ({ title, label }) => {
  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.share) {
      navigator.share({
        title,
        url: window.location.href,
      });
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
    >
      <Share2 className="w-4 h-4" />
      {label}
    </button>
  );
};