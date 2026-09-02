import toast from "react-hot-toast";
import { ShoppingCart, Heart } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios";
import { useEffect, useState } from "react";

const ProductCard = ({ product }) => {
    const { user } = useUserStore();
    const { addToCart } = useCartStore();
    const [wishlisted, setWishlisted] = useState(false);
    const outOfStock = Number(product.stock) <= 0;
    const lowStock = !outOfStock && Number(product.stock) <= Number(product.lowStockThreshold ?? 5);

    useEffect(() => {
        if (!user) return;
        axios.get("/account/wishlist").then((res) => setWishlisted((res.data.products || []).some((item) => item._id === product._id))).catch(() => {});
    }, [user, product._id]);

    const handleAddToCart = () => {
        if (!user) return toast.error("Please login to add products to cart", { id: "login" });
        if (outOfStock) return toast.error("This product is out of stock");
        addToCart(product);
    };
    const toggleWishlist = async () => {
        if (!user) return toast.error("Please login to use your wishlist", { id: "wishlist-login" });
        try { const res = await axios.patch(`/account/wishlist/${product._id}`); setWishlisted(res.data.wishlisted); toast.success(res.data.wishlisted ? "Added to wishlist" : "Removed from wishlist"); }
        catch (error) { toast.error(error.response?.data?.message || "Unable to update wishlist"); }
    };

    return <div className='flex w-full relative flex-col overflow-hidden rounded-lg border border-stone-700 shadow-lg'>
        <div className='relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl'><img className='object-cover w-full' src={product.image} alt={product.name}/><button onClick={toggleWishlist} aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"} className='absolute right-3 top-3 rounded-full bg-stone-900/80 p-2 text-white hover:text-yellow-400'><Heart size={20} fill={wishlisted ? "currentColor" : "none"}/></button></div>
        <div className='mt-4 px-5 pb-5'><h5 className='text-xl font-semibold tracking-tight text-white'>{product.name}</h5><p className='mt-2 text-sm text-stone-400 line-clamp-2'>{product.description}</p><div className='mt-3 flex items-center justify-between'><span className='text-2xl font-bold text-yellow-400'>${Number(product.price).toFixed(2)}</span><span className={`text-sm font-medium ${outOfStock ? 'text-red-400' : lowStock ? 'text-orange-400' : 'text-green-400'}`}>{outOfStock ? 'Out of stock' : lowStock ? `Only ${product.stock} left` : `${product.stock} in stock`}</span></div><button disabled={outOfStock} className='mt-4 flex w-full items-center justify-center rounded-lg bg-yellow-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-yellow-700 disabled:cursor-not-allowed disabled:bg-stone-600' onClick={handleAddToCart}><ShoppingCart size={22} className='mr-2'/> {outOfStock ? 'Out of stock' : 'Add to cart'}</button></div>
    </div>;
};
export default ProductCard;
