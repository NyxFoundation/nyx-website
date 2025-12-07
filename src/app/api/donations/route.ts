import { NextResponse } from "next/server";
import { sendDiscordNotification } from "@/lib/discord";

const getValue = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim() : "");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = getValue(formData.get("name"));
    const address = getValue(formData.get("address"));
    const amount = getValue(formData.get("amount"));
    const currencyRaw = getValue(formData.get("currency"));
    const icon = getValue(formData.get("icon"));
    const physicalAddress = getValue(formData.get("physicalAddress"));
    const tshirtSize = getValue(formData.get("tshirtSize"));
    const urlRaw = getValue(formData.get("url"));

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const fields = [
      { name: "Name", value: name, inline: true },
      { name: "Amount", value: `${amount || "Unknown"} ${currencyRaw || ""}`, inline: true },
    ];

    if (tshirtSize) fields.push({ name: "T-Shirt Size", value: tshirtSize, inline: true });
    if (address) fields.push({ name: "Wallet Address", value: address, inline: false });
    if (physicalAddress) fields.push({ name: "Physical Address", value: physicalAddress, inline: false });
    if (urlRaw) fields.push({ name: "URL", value: urlRaw, inline: false });
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to create donation submission", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
