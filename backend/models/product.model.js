import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, uppercase: true },
    price: { type: Number, min: 0 },
    stock: { type: Number, min: 0, default: 0 },
    image: { type: String, trim: true },
}, { _id: true });

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, min: 0, required: true },
    stock: { type: Number, min: 0, default: 100 },
    lowStockThreshold: { type: Number, min: 0, default: 5 },
    image: { type: String, required: [true, "Image is required"] },
    category: { type: String, required: true, trim: true },
    isFeatured: { type: Boolean, default: false },
    variants: { type: [variantSchema], default: [] },
}, { timestamps: true });

productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ stock: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;
