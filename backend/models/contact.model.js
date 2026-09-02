import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 100 },
        email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
        subject: { type: String, required: true, trim: true, maxlength: 150 },
        message: { type: String, required: true, trim: true, maxlength: 5000 },
        status: { type: String, enum: ["new", "in_progress", "resolved"], default: "new" },
    },
    { timestamps: true }
);

contactSchema.index({ status: 1, createdAt: -1 });

const ContactMessage = mongoose.model("ContactMessage", contactSchema);

export default ContactMessage;
