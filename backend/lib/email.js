import { logger } from "./logger.js";

export async function sendEmail({ to, subject, html }) {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
        logger.warn("Email delivery skipped: RESEND_API_KEY or RESEND_FROM_EMAIL is not configured");
        return false;
    }
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to: [to], subject, html }),
    });
    if (!response.ok) { const detail = await response.text(); throw new Error(`Email provider returned ${response.status}: ${detail.slice(0, 300)}`); }
    return true;
}

export async function sendEmailSafely(options, context = {}) {
    try { return await sendEmail(options); }
    catch (error) { logger.error("Email delivery failed", { error: error.message, ...context }); return false; }
}
