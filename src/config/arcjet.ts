import arcjet, { shield, detectBot } from "@arcjet/node";


if (!process.env.ARCJET_KEY && process.env.NODE_ENV !== "test") {
    throw new Error("process.env.ARCJET_KEY is missing");
}

const aj = arcjet({
    // Get your actor key from https://console.arcjet.com and set it as an environment
    // variable rather than hard coding.
    key: process.env.ARCJET_KEY!,
    rules: [
        // Shield protects your app from common attacks such as SQL injection
        shield({ mode: "LIVE" }),
        // Create a bot detection rule
        detectBot({
            mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
            // Block all bots except the following
            allow: [
                "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
                // Uncomment to allow these other common bot categories
                // See the full list at https://arcjet.com/bot-list
                //"CATEGORY:MONITOR", // Uptime monitoring services
                "CATEGORY:PREVIEW", // Link previews such as Slack, Discord
            ],
        })
        // Rate limiting is applied per role in middleware/security.ts
    ],
});

export default aj;