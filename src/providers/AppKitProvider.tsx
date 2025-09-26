"use client";

import { ReactNode, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, cookieToInitialState } from "wagmi";
import { createAppKit } from "@reown/appkit/react";

import { appKitMetadata, appKitNetworks, appKitProjectId, wagmiAdapter, wagmiConfig } from "@/lib/appkit/config";

declare global {
  interface Window {
    __NYX_APPKIT_MODAL__?: ReturnType<typeof createAppKit>;
  }
}

if (typeof window !== "undefined" && !window.__NYX_APPKIT_MODAL__) {
  // Silence Lit's dev-mode console warning when running in development builds.
  const globalWindow = window as typeof window & {
    litDisableDevModeWarnings?: boolean;
    litDisableDevelopmentModeWarning?: boolean;
  };
  globalWindow.litDisableDevModeWarnings = true;
  globalWindow.litDisableDevelopmentModeWarning = true;
  window.__NYX_APPKIT_MODAL__ = createAppKit({
    adapters: [wagmiAdapter],
    projectId: appKitProjectId,
    networks: appKitNetworks,
    metadata: appKitMetadata,
    features: {
      analytics: true,
      connectMethodsOrder: ["wallet"],
      onramp: false,
      swaps: false,
    },
    themeMode: "light",
    allowUnsupportedChain: true,
    isNewChainsStale: false,
  });
}

type Props = {
  children: ReactNode;
  cookies?: string | null;
};

export function AppKitProvider({ children, cookies }: Props) {
  const [queryClient] = useState(() => new QueryClient());
  const initialState = useMemo(() => (cookies ? cookieToInitialState(wagmiConfig, cookies) : undefined), [cookies]);

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
