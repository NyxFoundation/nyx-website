import { FIXED_AMOUNTS, NUMBER_LOCALE_MAP } from "./constants";
import type { PaymentMethod } from "./types";

const WEI_FACTOR = BigInt("1000000000000000000");
const DECIMAL_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumSignificantDigits: 21,
  useGrouping: false,
});

export const toWei = (amount: number) => {
  const sanitized = Number.isFinite(amount) ? Math.max(amount, 0) : 0;
  if (sanitized === 0) {
    return BigInt(0);
  }
  const decimal = DECIMAL_FORMATTER.format(sanitized);
  const [integerPart, fractionPart = ""] = decimal.split(".");
  const fraction = fractionPart.padEnd(18, "0").slice(0, 18);
  const integerWei = BigInt(integerPart) * WEI_FACTOR;
  const fractionalWei = fraction ? BigInt(fraction) : BigInt(0);
  return integerWei + fractionalWei;
};

export const toHexWei = (amount: number) => {
  const wei = toWei(amount);
  if (wei === BigInt(0)) {
    return "0x0";
  }
  return `0x${wei.toString(16)}`;
};

export const isUserRejectedRequest = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }
  const maybe = error as { code?: number; message?: string };
  if (typeof maybe.code === "number" && (maybe.code === 4001 || maybe.code === 5000)) {
    return true;
  }
  if (typeof maybe.message === "string") {
    const lower = maybe.message.toLowerCase();
    return lower.includes("user rejected") || lower.includes("rejected by user") || lower.includes("user cancelled");
  }
  return false;
};

export const toHexChainId = (chainId: number) => `0x${chainId.toString(16)}`;

export const toBaseUnits = (amount: number, decimals: number) => {
  const sanitized = Number.isFinite(amount) ? Math.max(amount, 0) : 0;
  if (sanitized === 0) {
    return BigInt(0);
  }
  const decimal = DECIMAL_FORMATTER.format(sanitized);
  const [integerPart, fractionPart = ""] = decimal.split(".");
  const fraction = fractionPart.padEnd(decimals, "0").slice(0, decimals);
  const digits = `${integerPart}${fraction}`.replace(/^0+/, "");
  const normalized = digits.length > 0 ? digits : "0";
  return BigInt(normalized);
};

export const encodeErc20Transfer = (recipient: string, amount: bigint) => {
  const selector = "a9059cbb";
  const addressPart = recipient.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  const amountPart = amount.toString(16).padStart(64, "0");
  return `0x${selector}${addressPart}${amountPart}`;
};

export const shortenAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

export const convertMethodAmountToEth = (amount: number, method: PaymentMethod) => {
  const ethTiers = FIXED_AMOUNTS.ETH ?? [];
  const methodTiers = FIXED_AMOUNTS[method] ?? [];

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }
  if (!ethTiers.length || !methodTiers.length) {
    return 0;
  }

  // FIXED_AMOUNTS[method] 内のどの tier かを特定し、その同じインデックスの ETH tier を返す
  const index = methodTiers.findIndex((tierAmount) => Math.abs(tierAmount - amount) < 1e-9);
  if (index >= 0 && index < ethTiers.length) {
    return ethTiers[index];
  }

  // 想定外の金額の場合は 0 ETH 扱い（FIXED_AMOUNTS 由来のみを許可）
  return 0;
};

export const formatMethodAmount = (amount: number, method: PaymentMethod, locale: string) => {
  if (method === "JPY") {
    return `${Math.round(amount).toLocaleString(locale)}円`;
  }

  if (method === "ETH") {
    const options =
      amount >= 1
        ? { minimumFractionDigits: 0, maximumFractionDigits: 2 }
        : { minimumFractionDigits: 2, maximumFractionDigits: 4 };
    return `${amount.toLocaleString(locale, options)} ETH`;
  }

  const displayLocale = NUMBER_LOCALE_MAP[locale] ?? locale;
  const isWhole = Math.abs(amount - Math.round(amount)) < 1e-6;
  return `${amount.toLocaleString(displayLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: isWhole ? 0 : 2,
  })} ${method}`;
};
