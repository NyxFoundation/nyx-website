import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare namespace JSX {
  interface IntrinsicElements {
    "appkit-button": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
      label?: string;
      size?: "sm" | "md" | "lg";
      balance?: "show" | "hide";
      variant?: "fill" | "outlined";
      disabled?: boolean;
    };
  }
}
