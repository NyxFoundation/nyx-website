import { NextResponse } from "next/server";
import { sendDiscordNotification } from "@/lib/discord";

function getStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = getStringValue(formData.get("name"));
    const email = getStringValue(formData.get("email"));
    const social = getStringValue(formData.get("social"));
    const content = getStringValue(formData.get("content"));

    if (!name || !email || !content) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await sendDiscordNotification({
      embeds: [
        {
          title: "📬 New Contact Form Submission",
          color: 0x3b82f6, // Blue
          fields: [
            { name: "Name", value: name, inline: true },
            { name: "Email", value: email, inline: true },
            { name: "Social", value: social || "N/A", inline: true },
            { name: "Content", value: content },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
