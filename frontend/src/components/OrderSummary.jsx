import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";
import { MoveRight, MapPin } from "lucide-react";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";
import { useState } from "react";

const OrderSummary = () => {
    const { total, subtotal, coupon, isCouponApplied, cart } = useCartStore();
    const { user } = useUserStore();
    const addresses = user?.addresses || [];
    const [selectedAddress, setSelectedAddress] = useState(addresses.find((a) => a.isDefault)?._id || addresses[0]?._id || "");
    const savings = subtotal - total;

    const handlePayment = async () => {
        if (!cart.length) return toast.error("Your cart is empty");
        const address = addresses.find((item) => item._id === selectedAddress);
        if (!address) return toast.error("Please add or select a shipping address in your account first.");
        try {
            const res = await axios.post("/payments/create-checkout-session", { products: cart, couponCode: coupon ? coupon.code : null, shippingAddress: address });
            if (!res.data?.url) throw new Error("The server did not return a Stripe checkout URL.");
            window.location.assign(res.data.url);
        } catch (error) { console.error("Checkout error:", error); toast.error(error.response?.data?.message || error.message || "Unable to start checkout. Please try again."); }
    };

    return <motion.div className='space-y-4 rounded-lg border border-stone-700 bg-stone-800 p-4 shadow-sm sm:p-6' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className='text-xl font-semibold text-yellow-400'>Order summary</p>
        <div className='rounded-md border border-stone-700 p-3'>
            <label className='flex items-center gap-2 text-sm font-medium text-stone-300'><MapPin size={17}/> Shipping address</label>
            {addresses.length ? <select value={selectedAddress} onChange={(e) => setSelectedAddress(e.target.value)} className='mt-2 w-full rounded-md border border-stone-600 bg-stone-700 px-3 py-2 text-white'>{addresses.map((a) => <option key={a._id} value={a._id}>{a.label} — {a.line1}, {a.city}, {a.state} {a.postalCode}</option>)}</select> : <p className='mt-2 text-sm text-stone-400'>No saved address. <Link to='/account' className='text-yellow-400 underline'>Add one in your account.</Link></p>}
        </div>
        <div className='space-y-2'><dl className='flex justify-between'><dt className='text-stone-300'>Original price</dt><dd>${subtotal.toFixed(2)}</dd></dl>{savings > 0 && <dl className='flex justify-between'><dt className='text-stone-300'>Savings</dt><dd className='text-yellow-400'>-${savings.toFixed(2)}</dd></dl>}{coupon && isCouponApplied && <dl className='flex justify-between'><dt className='text-stone-300'>Coupon ({coupon.code})</dt><dd className='text-yellow-400'>-{coupon.discountPercentage}%</dd></dl>}<dl className='flex justify-between border-t border-stone-600 pt-2 font-bold'><dt>Total</dt><dd className='text-yellow-400'>${total.toFixed(2)}</dd></dl></div>
        <motion.button disabled={!addresses.length} className='flex w-full items-center justify-center rounded-lg bg-yellow-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50' whileHover={{ scale: addresses.length ? 1.02 : 1 }} whileTap={{ scale: addresses.length ? 0.98 : 1 }} onClick={handlePayment}>Proceed to Checkout</motion.button>
        <div className='flex items-center justify-center gap-2'><span className='text-sm text-stone-400'>or</span><Link to='/' className='inline-flex items-center gap-2 text-sm font-medium text-yellow-400 underline'>Continue Shopping<MoveRight size={16}/></Link></div>
    </motion.div>;
};
export default OrderSummary;
