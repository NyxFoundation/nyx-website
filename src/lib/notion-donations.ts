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
    txHash?: string | null;
    chain?: string | null;
    status?: "pending" | "approved" | null;
}

export async function findDonationByTxHash(txHash: string): Promise<boolean> {
    const trimmed = txHash.trim();
    if (!trimmed) return false;
    try {
        const result = await notion.databases.query({
            database_id: donationDatabaseId,
            filter: {
                property: "TxHash",
                rich_text: { equals: trimmed },
            },
            page_size: 1,
        });
        return result.results.length > 0;
    } catch (error) {
        // If the property doesn't exist yet (Notion DB not migrated), don't block submissions.
        console.warn("findDonationByTxHash failed, treating as not-found:", error);
        return false;
    }
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
    const { name, address, physicalAddress, tshirtSize, amount, currency, icon, url, txHash, chain, status } = submission;

    const amountNumber = parseAmount(amount);
    const amountValue = amountNumber ?? null;
    const currencyText = currency ? truncate(currency, 2000) : null;
    const iconUrl = icon && /^https?:\/\//i.test(icon) ? icon : null;
    const physicalAddressText = physicalAddress ? truncate(physicalAddress, 2000) : null;
    const tshirtText = tshirtSize ?? null;
    const txHashText = txHash ? truncate(txHash, 2000) : null;
    const chainText = chain ? truncate(chain, 2000) : null;
    const statusText = status ?? null;

    const baseProperties: Record<string, unknown> = {
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

    // Optional verification fields. Notion will reject the create if these
    // properties don't exist in the database schema, so we attempt with them
    // and fall back without them on schema errors.
    const optionalProperties: Record<string, unknown> = {};
    if (txHashText) {
        optionalProperties.TxHash = {
            rich_text: [{ text: { content: txHashText } }],
        };
    }
    if (chainText) {
        optionalProperties.Chain = {
            rich_text: [{ text: { content: chainText } }],
        };
    }
    if (statusText) {
        optionalProperties.Status = {
            select: { name: statusText },
        };
    }

    const propertiesWithOptional = { ...baseProperties, ...optionalProperties };

    try {
        await notion.pages.create({
            parent: { database_id: donationDatabaseId },
            properties: propertiesWithOptional as Parameters<typeof notion.pages.create>[0]["properties"],
        });
    } catch (error) {
        if (Object.keys(optionalProperties).length > 0) {
            console.warn(
                "Notion create failed with optional verification properties. Retrying without them. Add TxHash/Chain/Status columns to the donations DB to persist them.",
                error,
            );
            await notion.pages.create({
                parent: { database_id: donationDatabaseId },
                properties: baseProperties as Parameters<typeof notion.pages.create>[0]["properties"],
            });
        } else {
            throw error;
        }
    }
}
