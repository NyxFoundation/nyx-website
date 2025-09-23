import { Client } from "@notionhq/client";

const notionToken = process.env.NOTION_TOKEN;
const donationDatabaseId = process.env.NOTION_DONATIONS_DATABASE_ID;

if (!notionToken) {
  throw new Error("NOTION_TOKEN is not defined");
}

if (!donationDatabaseId) {
  throw new Error("NOTION_DONATIONS_DATABASE_ID is not defined");
}

const notion = new Client({
  auth: notionToken,
});

export interface DonationSubmission {
  name: string;
  address?: string | null;
  amount?: string | null;
  currency?: string | null;
  icon?: string | null;
  url?: string | null;
}

const parseAmount = (rawAmount?: string | null) => {
  if (!rawAmount) {
    return null;
  }
  const normalized = rawAmount.replace(/[,:\s]/g, "").replace(/[^\d\.\-]/g, "");
  const parsed = Number(normalized);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return null;
};

const truncate = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
};

export async function createDonationSubmission(submission: DonationSubmission) {
  const { name, address, amount, currency, icon, url } = submission;

  const amountNumber = parseAmount(amount);
  const amountValue = amountNumber ?? null;
  const currencyText = currency ? truncate(currency, 2000) : null;
  const iconUrl = icon && /^https?:\/\//i.test(icon) ? icon : null;

  const properties: Record<string, unknown> = {
    Name: {
      title: [
        {
          text: {
            content: truncate(name, 2000),
          },
        },
      ],
    },
    Address: {
      rich_text: address
        ? [
            {
              text: {
                content: truncate(address, 2000),
              },
            },
          ]
        : [],
    },
    Amount: {
      number: amountValue,
    },
    Currency: {
      rich_text: currencyText
        ? [
            {
              text: {
                content: currencyText,
              },
            },
          ]
        : [],
    },
    Icon: {
      url: iconUrl,
    },
    URL: {
      url: url && url.length > 0 ? url : null,
    },
  };

  Object.keys(properties).forEach((key) => {
    if (properties[key] === undefined) {
      Reflect.deleteProperty(properties, key);
    }
  });

  await notion.pages.create({
    parent: {
      database_id: donationDatabaseId,
    },
    properties,
  });
}
