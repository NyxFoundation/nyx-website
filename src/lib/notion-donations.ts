import { Client } from "@notionhq/client";

const getEnvOrThrow = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not defined`);
  }
  return value;
};

const notionToken = getEnvOrThrow("NOTION_TOKEN");
const donationDatabaseId = getEnvOrThrow("NOTION_DONATIONS_DATABASE_ID");

const notion = new Client({
  auth: notionToken,
});

export interface DonationSubmission {
  name: string;
  address?: string | null;
  physicalAddress?: string | null;
  tshirtSize?: "S" | "M" | "L" | "XL" | null;
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
  const { name, address, physicalAddress, tshirtSize, amount, currency, icon, url } = submission;

  const amountNumber = parseAmount(amount);
  const amountValue = amountNumber ?? null;
  const currencyText = currency ? truncate(currency, 2000) : null;
  const iconUrl = icon && /^https?:\/\//i.test(icon) ? icon : null;
  const physicalAddressText = physicalAddress ? truncate(physicalAddress, 2000) : null;
  const tshirtText = tshirtSize ?? null;

  const properties = {
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
    "Physical Address": {
      rich_text: physicalAddressText
        ? [
            {
              text: {
                content: physicalAddressText,
              },
            },
          ]
        : [],
    },
    TShirtSize: {
      select: tshirtText
        ? {
            name: tshirtText,
          }
        : null,
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

  await notion.pages.create({
    parent: {
      database_id: donationDatabaseId,
    },
    properties: properties as Parameters<typeof notion.pages.create>[0]["properties"],
  });
}
