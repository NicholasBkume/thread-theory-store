import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
        status: {
            type: String,
            enum: ["subscribed", "unsubscribed"],
            default: "subscribed",
        },
        subscribedAt: {
            type: Date,
            default: Date.now,
        },
        unsubscribedAt: Date,
    },
    { timestamps: true }
);

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

export default Subscriber;
