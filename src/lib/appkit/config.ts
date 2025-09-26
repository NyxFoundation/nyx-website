import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { arbitrum, base, mainnet, optimism } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { cookieStorage, createStorage } from "wagmi";

export const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

export const appKitProjectId = walletConnectProjectId || "demo";

export const isWalletConnectConfigured = Boolean(walletConnectProjectId) || process.env.NODE_ENV !== "production";

export const appKitNetworks = [mainnet, arbitrum, optimism, base] as unknown as [
  AppKitNetwork,
  ...AppKitNetwork[]
];

export const appKitMetadata = {
  name: "Nyx Foundation",
  description: "Nyx Foundation donations",
  url: "https://nyx.foundation",
  icons: ["https://nyx.foundation/icon.png"],
};

export const wagmiAdapter = new WagmiAdapter({
  projectId: appKitProjectId,
  networks: appKitNetworks,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
