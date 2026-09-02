const rateLimitStore = new Map();

const getClientKey = (req, keyPrefix) => `${keyPrefix}:${req.ip || req.socket.remoteAddress || "unknown"}`;

export const securityHeaders = (_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

    if (process.env.NODE_ENV === "production") {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    next();
};

export const apiRateLimit = ({ windowMs = 15 * 60 * 1000, max = 100, keyPrefix = "api" } = {}) => (req, res, next) => {
    const now = Date.now();
    const key = getClientKey(req, keyPrefix);
    const entry = rateLimitStore.get(key);

    if (!entry || now >= entry.resetAt) {
        rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
        return next();
    }

    entry.count += 1;
    if (entry.count > max) {
        const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
        res.setHeader("Retry-After", retryAfter);
        return res.status(429).json({ message: "Too many requests. Please try again later." });
    }

    next();
};

export const clearRateLimitStore = () => rateLimitStore.clear();

setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
        if (now >= entry.resetAt) rateLimitStore.delete(key);
    }
}, 5 * 60 * 1000).unref();
