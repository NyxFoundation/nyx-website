import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const getEnvOrThrow = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not defined`);
  }
  return value;
};

const notionToken = getEnvOrThrow("NOTION_TOKEN");
const contactDatabaseId = getEnvOrThrow("NOTION_CONTACT_DATABASE_ID");

const notion = new Client({ auth: notionToken });

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

    await notion.pages.create({
      parent: { database_id: contactDatabaseId },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: name,
              },
            },
          ],
        },
        "Email Address": {
          email,
        },
        "Social Media": {
          url: social || null,
        },
        Content: {
          rich_text: [
            {
              text: {
                content,
              },
            },
          ],
        },
      },
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
