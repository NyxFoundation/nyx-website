import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { sendDiscordNotification } from "@/lib/discord";
import { isHoneypotTriggered } from "@/lib/spam-protection";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

function getStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(ip, 5, 60);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 }
      );
    }

    const formData = await request.formData();

    if (isHoneypotTriggered(formData)) {
      // Pretend success so bots don't learn they were rejected.
      return NextResponse.json({ success: true });
    }

    const position = getStringValue(formData.get("position"));
    const name = getStringValue(formData.get("name"));
    const email = getStringValue(formData.get("email"));
    const social = getStringValue(formData.get("social"));
    const motivation = getStringValue(formData.get("motivation"));
    const experience = getStringValue(formData.get("experience"));
    const remarks = getStringValue(formData.get("remarks"));

    if (!name || !email || !motivation || !experience) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Send Discord notification
    await sendDiscordNotification({
      embeds: [
        {
          title: "📋 New Job Application",
          color: 0x10b981, // Green
          fields: [
            { name: "Position", value: position || "N/A", inline: true },
            { name: "Name", value: name, inline: true },
            { name: "Email", value: email, inline: true },
            { name: "Social", value: social || "N/A", inline: true },
            { name: "Motivation", value: motivation.slice(0, 1024) },
            { name: "Experience", value: experience.slice(0, 1024) },
            ...(remarks
              ? [{ name: "Remarks", value: remarks.slice(0, 1024) }]
              : []),
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    });

    // Create Notion page
    const notionToken = process.env.NOTION_TOKEN;
    const databaseId = process.env.NOTION_RECRUIT_FORM_DATABASE_ID;

    if (notionToken && databaseId) {
      const notion = new Client({ auth: notionToken });

      const contentBlocks = [
        {
          object: "block" as const,
          type: "heading_2" as const,
          heading_2: {
            rich_text: [{ type: "text" as const, text: { content: "応募情報" } }],
          },
        },
        {
          object: "block" as const,
          type: "paragraph" as const,
          paragraph: {
            rich_text: [
              { type: "text" as const, text: { content: "応募ポジション: " }, annotations: { bold: true } },
              { type: "text" as const, text: { content: position || "未指定" } },
            ],
          },
        },
        {
          object: "block" as const,
          type: "paragraph" as const,
          paragraph: {
            rich_text: [
              { type: "text" as const, text: { content: "名前: " }, annotations: { bold: true } },
              { type: "text" as const, text: { content: name } },
            ],
          },
        },
        {
          object: "block" as const,
          type: "paragraph" as const,
          paragraph: {
            rich_text: [
              { type: "text" as const, text: { content: "メールアドレス: " }, annotations: { bold: true } },
              { type: "text" as const, text: { content: email } },
            ],
          },
        },
        {
          object: "block" as const,
          type: "paragraph" as const,
          paragraph: {
            rich_text: [
              { type: "text" as const, text: { content: "SNSアカウント: " }, annotations: { bold: true } },
              { type: "text" as const, text: { content: social || "なし" } },
            ],
          },
        },
        {
          object: "block" as const,
          type: "divider" as const,
          divider: {},
        },
        {
          object: "block" as const,
          type: "heading_2" as const,
          heading_2: {
            rich_text: [{ type: "text" as const, text: { content: "志望動機" } }],
          },
        },
        {
          object: "block" as const,
          type: "paragraph" as const,
          paragraph: {
            rich_text: [{ type: "text" as const, text: { content: motivation } }],
          },
        },
        {
          object: "block" as const,
          type: "divider" as const,
          divider: {},
        },
        {
          object: "block" as const,
          type: "heading_2" as const,
          heading_2: {
            rich_text: [{ type: "text" as const, text: { content: "経験・スキルセット" } }],
          },
        },
        {
          object: "block" as const,
          type: "paragraph" as const,
          paragraph: {
            rich_text: [{ type: "text" as const, text: { content: experience } }],
          },
        },
        ...(remarks
          ? [
              {
                object: "block" as const,
                type: "divider" as const,
                divider: {},
              },
              {
                object: "block" as const,
                type: "heading_2" as const,
                heading_2: {
                  rich_text: [{ type: "text" as const, text: { content: "備考" } }],
                },
              },
              {
                object: "block" as const,
                type: "paragraph" as const,
                paragraph: {
                  rich_text: [{ type: "text" as const, text: { content: remarks } }],
                },
              },
            ]
          : []),
      ];

      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          名前: {
            title: [{ text: { content: name } }],
          },
          メールアドレス: {
            rich_text: [{ text: { content: email } }],
          },
          SNSアカウント: {
            rich_text: [{ text: { content: social || "" } }],
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: contentBlocks as any,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
