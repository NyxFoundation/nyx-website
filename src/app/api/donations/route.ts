import { NextResponse } from "next/server";
import { sendDiscordNotification } from "@/lib/discord";
import { createDonationSubmission, type DonationSubmission } from "@/lib/notion-donations";

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
    const formData = await request.formData();

    const name = getValue(formData.get("name"));
    const address = getValue(formData.get("address"));
    const amount = getValue(formData.get("amount"));
    const currencyRaw = getValue(formData.get("currency"));
    const icon = getValue(formData.get("icon"));
    const physicalAddress = getValue(formData.get("physicalAddress"));
    const tshirtSize = normalizeTshirtSize(getValue(formData.get("tshirtSize")));
    const urlRaw = getValue(formData.get("url"));

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const url = urlRaw || null;
    if (url && !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // 1. Send Discord Notification
    try {
      const fields = [
        { name: "Name", value: name, inline: true },
        { name: "Amount", value: `${amount || "Unknown"} ${currencyRaw || ""}`, inline: true },
      ];

      if (tshirtSize) fields.push({ name: "T-Shirt Size", value: tshirtSize, inline: true });
      if (address) fields.push({ name: "Wallet Address", value: address, inline: false });
      if (physicalAddress) fields.push({ name: "Physical Address", value: physicalAddress, inline: false });
      if (url) fields.push({ name: "URL", value: url, inline: false });
      if (icon) fields.push({ name: "Icon", value: icon, inline: false });

      await sendDiscordNotification({
        embeds: [
          {
            title: "🎁 New Donation Submission",
            color: 0x10b981, // Green
            fields: fields.map(f => ({ ...f, value: f.value || "N/A" })),
            timestamp: new Date().toISOString(),
          },
        ],
      });
    } catch (discordError) {
      console.error("Failed to send Discord notification for donation:", discordError);
      // Continue to Notion submission even if Discord fails
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
      });
    } catch (notionError) {
      console.error("Failed to add donation to Notion:", notionError);
      // Start of error handling strategy:
      // If Notion fails, we probably want to return 500 because this is data persistence.
      // Discord is notification, Notion is database.
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to create donation submission", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
