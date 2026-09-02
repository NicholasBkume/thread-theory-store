import Subscriber from "../models/subscriber.model.js";
import ContactMessage from "../models/contact.model.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const subscribe = async (req, res) => {
    try {
        const email = String(req.body?.email || "").trim().toLowerCase();
        if (!emailPattern.test(email) || email.length > 254) {
            return res.status(400).json({ message: "Please provide a valid email address" });
        }

        const existing = await Subscriber.findOne({ email });
        if (existing?.status === "subscribed") {
            return res.status(200).json({ message: "You're already subscribed" });
        }

        if (existing) {
            existing.status = "subscribed";
            existing.subscribedAt = new Date();
            existing.unsubscribedAt = undefined;
            await existing.save();
            return res.status(200).json({ message: "Welcome back! You're subscribed" });
        }

        await Subscriber.create({ email });
        return res.status(201).json({ message: "Thanks for subscribing!" });
    } catch (error) {
        if (error.code === 11000) return res.status(200).json({ message: "You're already subscribed" });
        return res.status(500).json({ message: "Failed to subscribe" });
    }
};

export const createContactMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body || {};
        const normalizedEmail = String(email || "").trim().toLowerCase();
        if (!String(name || "").trim() || !emailPattern.test(normalizedEmail) || !String(subject || "").trim() || !String(message || "").trim()) {
            return res.status(400).json({ message: "Name, email, subject, and message are required" });
        }
        if (String(name).trim().length > 100 || normalizedEmail.length > 254 || String(subject).trim().length > 150 || String(message).trim().length > 5000) {
            return res.status(400).json({ message: "One or more fields exceed the allowed length" });
        }

        const contactMessage = await ContactMessage.create({
            name: String(name).trim(),
            email: normalizedEmail,
            subject: String(subject).trim(),
            message: String(message).trim(),
        });
        return res.status(201).json({ message: "Your message has been sent", id: contactMessage._id });
    } catch (error) {
        return res.status(500).json({ message: "Failed to send message" });
    }
};

export const getContactMessages = async (_req, res) => {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });
        return res.status(200).json({ messages });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch contact messages" });
    }
};

export const updateContactStatus = async (req, res) => {
    try {
        const allowedStatuses = ["new", "in_progress", "resolved"];
        if (!allowedStatuses.includes(req.body?.status)) return res.status(400).json({ message: "Invalid contact status" });
        const message = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
        if (!message) return res.status(404).json({ message: "Message not found" });
        return res.status(200).json({ message });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update message" });
    }
};
