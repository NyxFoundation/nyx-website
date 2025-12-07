/**
 * Sends a notification to the configured Discord Webhook.
 */
export async function sendDiscordNotification(payload: {
    content?: string;
    embeds?: Array<{
        title?: string;
        description?: string;
        url?: string;
        color?: number;
        fields?: Array<{
            name: string;
            value: string;
            inline?: boolean;
        }>;
        footer?: {
            text: string;
            icon_url?: string;
        };
        timestamp?: string;
    }>;
}) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        if (process.env.NODE_ENV === "production") {
            console.error("DISCORD_WEBHOOK_URL is not defined");
        } else {
            console.warn("DISCORD_WEBHOOK_URL is not defined, skipping notification (dev mode)");
        }
        return;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Discord API responded with status: ${response.status} - ${text}`);
        }
    } catch (error) {
        console.error("Failed to send Discord notification:", error);
        // We re-throw or handle based on requirement. 
        // Here we might want to ensure the user knows it failed if it's critical, 
        // but for non-critical logging we might just log it.
        // Given these are form submissions, we should probably let the caller know or at least log heavily.
        throw error;
    }
}
