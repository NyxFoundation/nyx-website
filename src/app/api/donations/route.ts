import { NextResponse } from "next/server";

import { createDonationSubmission } from "@/lib/notion-donations";

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

    const url = urlRaw || null;
    if (url && !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    await createDonationSubmission({
      name,
      address: address || null,
      physicalAddress: physicalAddress || null,
      tshirtSize: tshirtSize || null,
      amount: amount || null,
      currency: currencyRaw ? currencyRaw.toUpperCase() : null,
      icon: icon || null,
      url,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to create donation submission", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
