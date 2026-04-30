import { NextResponse } from "next/server";
import { sendDiscordNotification } from "@/lib/discord";
import { createDonationSubmission, findDonationByTxHash, type DonationSubmission } from "@/lib/notion-donations";
import { isHoneypotTriggered } from "@/lib/spam-protection";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { verifyOnchainDonation } from "@/lib/donation-verify";

const getValue = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim() : "");

const ALLOWED_TSHIRT_SIZES = new Set<NonNullable<DonationSubmission["tshirtSize"]>>(["S", "M", "L", "XL"]);

const normalizeTshirtSize = (value: string): DonationSubmission["tshirtSize"] => {
  if (!value) {
    return null;
  }

  const upper = value.toUpperCase() as NonNullable<DonationSubmission["tshirtSize"]>;
  return ALLOWED_TSHIRT_SIZES.has(upper) ? upper : null;
};

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(ip, 5, 60);
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const formData = await request.formData();

    if (isHoneypotTriggered(formData)) {
      return NextResponse.json({ ok: true });
    }

    const name = getValue(formData.get("name"));
    const address = getValue(formData.get("address"));
    const amount = getValue(formData.get("amount"));
    const currencyRaw = getValue(formData.get("currency"));
    const icon = getValue(formData.get("icon"));
    const physicalAddress = getValue(formData.get("physicalAddress"));
    const tshirtSize = normalizeTshirtSize(getValue(formData.get("tshirtSize")));
    const urlRaw = getValue(formData.get("url"));
    const txHash = getValue(formData.get("txHash"));
    const chain = getValue(formData.get("chain"));

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const url = urlRaw || null;
    if (url && !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const method = currencyRaw ? currencyRaw.toUpperCase() : "";
    const isFiat = method === "JPY";

    // Verify on-chain donations. JPY (bank transfer) bypasses on-chain
    // checks and is recorded as `pending` for manual reconciliation.
    let status: "pending" | "approved" = "pending";
    if (!isFiat) {
      if (!txHash || !chain || !amount) {
        return NextResponse.json(
          { error: "txHash, chain, and amount are required for crypto donations" },
          { status: 400 },
        );
      }

      const alreadyRegistered = await findDonationByTxHash(txHash);
      if (alreadyRegistered) {
        return NextResponse.json(
          { error: "This transaction is already registered" },
          { status: 409 },
        );
      }

      const verification = await verifyOnchainDonation({ txHash, chain, method, amount });
      if (!verification.valid) {
        return NextResponse.json(
          { error: `Verification failed: ${verification.reason}` },
          { status: 400 },
        );
      }
      status = "approved";
    }

    // 1. Send Discord Notification
    try {
      const fields = [
        { name: "Name", value: name, inline: true },
        { name: "Amount", value: `${amount || "Unknown"} ${currencyRaw || ""}`, inline: true },
        { name: "Status", value: status, inline: true },
      ];

      if (chain) fields.push({ name: "Chain", value: chain, inline: true });
      if (txHash) fields.push({ name: "Tx Hash", value: txHash, inline: false });
      if (tshirtSize) fields.push({ name: "T-Shirt Size", value: tshirtSize, inline: true });
      if (address) fields.push({ name: "Wallet Address", value: address, inline: false });
      if (physicalAddress) fields.push({ name: "Physical Address", value: physicalAddress, inline: false });
      if (url) fields.push({ name: "URL", value: url, inline: false });
      if (icon) fields.push({ name: "Icon", value: icon, inline: false });

      await sendDiscordNotification({
        embeds: [
          {
            title: "🎁 New Donation Submission",
            color: 0x10b981,
            fields: fields.map(f => ({ ...f, value: f.value || "N/A" })),
            timestamp: new Date().toISOString(),
          },
        ],
      });
    } catch (discordError) {
      console.error("Failed to send Discord notification for donation:", discordError);
    }

    // 2. Add to Notion Database
    try {
      await createDonationSubmission({
        name,
        address: address || null,
        physicalAddress: physicalAddress || null,
        tshirtSize,
        amount: amount || null,
        currency: currencyRaw ? currencyRaw.toUpperCase() : null,
        icon: icon || null,
        url,
        txHash: txHash || null,
        chain: chain || null,
        status,
      });
    } catch (notionError) {
      console.error("Failed to add donation to Notion:", notionError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("Failed to create donation submission", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
