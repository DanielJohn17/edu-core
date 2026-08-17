import arcjet, { shield, detectBot } from "@arcjet/node";

if (!process.env.ARCJET_KEY && process.env.NODE_ENV !== "test") {
  throw new Error("ARCJET_KEY is required");
}

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        "CATEGORY:MONITOR", // Uptime monitoring services
        "CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
      ],
    }),
  ],
});

export default aj;
