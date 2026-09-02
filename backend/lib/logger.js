const SENSITIVE_KEYS = new Set([
    "password",
    "token",
    "accesstoken",
    "refreshtoken",
    "authorization",
    "cookie",
    "stripe-signature",
    "stripe_secret_key",
    "stripe_webhook_secret",
    "cloudinary_api_secret",
    "mongo_url",
    "redis_url",
]);

const sanitize = (value) => {
    if (!value || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(sanitize);

    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
            key,
            SENSITIVE_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : sanitize(item),
        ])
    );
};

const write = (level, message, context = {}) => {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        service: "thread-theory-store-api",
        message,
        ...sanitize(context),
    };

    const output = JSON.stringify(entry);
    if (level === "error") console.error(output);
    else if (level === "warn") console.warn(output);
    else console.log(output);
};

export const logger = {
    info: (message, context) => write("info", message, context),
    warn: (message, context) => write("warn", message, context),
    error: (message, context) => write("error", message, context),
};
