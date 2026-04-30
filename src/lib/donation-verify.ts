import {
  createPublicClient,
  http,
  parseAbi,
  decodeEventLog,
  parseEther,
  parseUnits,
  type Address,
  type Hex,
} from "viem";
import { mainnet, optimism, arbitrum, base } from "viem/chains";
import donateData from "@/data/donate.json";

const ERC20_TRANSFER_ABI = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

type ChainKey = "ethereum" | "optimism" | "arbitrum" | "base";

const CHAINS = {
  ethereum: mainnet,
  optimism,
  arbitrum,
  base,
} as const;

type Erc20Meta = {
  decimals: number;
  contracts: Partial<Record<ChainKey, `0x${string}`>>;
};

const ERC20_METADATA = (donateData as { erc20Metadata: Record<string, Erc20Meta> }).erc20Metadata;

const DONATION_ADDRESS = (donateData as { donationAddress: string }).donationAddress.toLowerCase();

export type VerifyArgs = {
  txHash: string;
  chain: string;
  method: string; // "ETH" | "USDC" | "USDT" | "DAI" | "JPY"
  amount: string; // human readable, e.g. "0.05"
};

export type VerifyResult =
  | { valid: true }
  | { valid: false; reason: string };

const isValidChain = (chain: string): chain is ChainKey =>
  chain in CHAINS;

const isHexHash = (value: string): value is Hex =>
  /^0x[a-fA-F0-9]{64}$/.test(value);

export async function verifyOnchainDonation(args: VerifyArgs): Promise<VerifyResult> {
  const method = args.method.toUpperCase();
  if (method === "JPY") {
    return { valid: false, reason: "JPY donations are reconciled manually" };
  }

  if (!args.txHash || !isHexHash(args.txHash)) {
    return { valid: false, reason: "Invalid txHash" };
  }

  if (!isValidChain(args.chain)) {
    return { valid: false, reason: `Unsupported chain: ${args.chain}` };
  }

  const client = createPublicClient({
    chain: CHAINS[args.chain],
    transport: http(),
  });

  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: args.txHash });
  } catch {
    return { valid: false, reason: "Transaction not found yet" };
  }

  if (receipt.status !== "success") {
    return { valid: false, reason: "Transaction did not succeed" };
  }

  if (method === "ETH") {
    const tx = await client.getTransaction({ hash: args.txHash });
    if (!tx.to) {
      return { valid: false, reason: "Transaction has no recipient" };
    }
    if (tx.to.toLowerCase() !== DONATION_ADDRESS) {
      return { valid: false, reason: "Recipient is not the donation address" };
    }
    let expected: bigint;
    try {
      expected = parseEther(args.amount as `${number}`);
    } catch {
      return { valid: false, reason: "Invalid ETH amount" };
    }
    // Allow 1% tolerance for fees / display rounding.
    const minAccepted = (expected * BigInt(99)) / BigInt(100);
    if (tx.value < minAccepted) {
      return { valid: false, reason: "Transferred ETH is less than the reported amount" };
    }
    return { valid: true };
  }

  // ERC-20 path
  const meta = ERC20_METADATA[method];
  if (!meta) {
    return { valid: false, reason: `Unsupported token: ${method}` };
  }
  const tokenAddress = meta.contracts[args.chain]?.toLowerCase();
  if (!tokenAddress) {
    return { valid: false, reason: `${method} not supported on ${args.chain}` };
  }

  let expectedUnits: bigint;
  try {
    expectedUnits = parseUnits(args.amount as `${number}`, meta.decimals);
  } catch {
    return { valid: false, reason: "Invalid token amount" };
  }
  const minAccepted = (expectedUnits * BigInt(99)) / BigInt(100);

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== tokenAddress) continue;
    try {
      const decoded = decodeEventLog({
        abi: ERC20_TRANSFER_ABI,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName !== "Transfer") continue;
      const { to, value } = decoded.args as { from: Address; to: Address; value: bigint };
      if (to.toLowerCase() !== DONATION_ADDRESS) continue;
      if (value < minAccepted) {
        return { valid: false, reason: "Transferred token amount is less than reported" };
      }
      return { valid: true };
    } catch {
      // Not a Transfer event we can decode — skip.
    }
  }

  return { valid: false, reason: "No qualifying ERC-20 Transfer to donation address found" };
}
