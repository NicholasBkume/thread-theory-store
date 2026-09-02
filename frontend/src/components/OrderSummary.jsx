import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const OrderSummary = () => {
    const { total, subtotal, coupon, isCouponApplied, cart } = useCartStore();

    const savings = subtotal - total;
    const formattedSubtotal = subtotal.toFixed(2);
    const formattedTotal = total.toFixed(2);
    const formattedSavings = savings.toFixed(2);

    const handlePayment = async () => {
        if (!cart.length) {
            toast.error("Your cart is empty");
            return;
        }

        try {
            const stripe = await stripePromise;
            if (!stripe) {
                throw new Error("Stripe could not be initialized. Check VITE_STRIPE_PUBLISHABLE_KEY.");
            }

            const res = await axios.post("/payments/create-checkout-session", {
                products: cart,
                couponCode: coupon ? coupon.code : null,
            });

            const session = res.data;
            if (!session?.id) {
                throw new Error("The server did not return a Stripe checkout session.");
            }

            const result = await stripe.redirectToCheckout({
                sessionId: session.id,
            });

            if (result.error) {
                throw result.error;
            }
        } catch (error) {
            console.error("Checkout error:", error);
            toast.error(
                error.response?.data?.message ||
                    error.message ||
                    "Unable to start checkout. Please try again."
            );
        }
    };

    return (
        <motion.div
            className='space-y-4 rounded-lg border border-stone-700 bg-stone-800 p-4 shadow-sm sm:p-6'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <p className='text-xl font-semibold text-yellow-400'>Order summary</p>

            <div className='space-y-4'>
                <div className='space-y-2'>
                    <dl className='flex items-center justify-between gap-4'>
                        <dt className='text-base font-normal text-stone-300'>Original price</dt>
                        <dd className='text-base font-medium text-white'>${formattedSubtotal}</dd>
                    </dl>

                    {savings > 0 && (
                        <dl className='flex items-center justify-between gap-4'>
                            <dt className='text-base font-normal text-stone-300'>Savings</dt>
                            <dd className='text-base font-medium text-yellow-400'>-${formattedSavings}</dd>
                        </dl>
                    )}

                    {coupon && isCouponApplied && (
                        <dl className='flex items-center justify-between gap-4'>
                            <dt className='text-base font-normal text-stone-300'>Coupon ({coupon.code})</dt>
                            <dd className='text-base font-medium text-yellow-400'>-{coupon.discountPercentage}%</dd>
                        </dl>
                    )}
                    <dl className='flex items-center justify-between gap-4 border-t border-stone-600 pt-2'>
                        <dt className='text-base font-bold text-white'>Total</dt>
                        <dd className='text-base font-bold text-yellow-400'>${formattedTotal}</dd>
                    </dl>
                </div>

                <motion.button
                    className='flex w-full items-center justify-center rounded-lg bg-yellow-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-4 focus:ring-yellow-300'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePayment}
                >
                    Proceed to Checkout
                </motion.button>

                <div className='flex items-center justify-center gap-2'>
                    <span className='text-sm font-normal text-stone-400'>or</span>
                    <Link
                        to='/'
                        className='inline-flex items-center gap-2 text-sm font-medium text-yellow-400 underline hover:text-yellow-300 hover:no-underline'
                    >
                        Continue Shopping
                        <MoveRight size={16} />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};
export default OrderSummary;
