import { logger } from "../lib/logger.js";

export const notFoundHandler = (req, res, next) => {
    if (req.path.startsWith("/api/")) {
        const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
        error.statusCode = 404;
        return next(error);
    }
    return next();
};

export const errorHandler = (error, req, res, _next) => {
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    const isProduction = process.env.NODE_ENV === "production";

    logger.error("Unhandled API error", {
        method: req.method,
        path: req.originalUrl,
        statusCode,
        error: error?.message || "Unknown error",
        stack: isProduction ? undefined : error?.stack,
    });

    return res.status(statusCode).json({
        message: statusCode >= 500 && isProduction
            ? "Internal server error"
            : error?.message || "Server error",
    });
};
