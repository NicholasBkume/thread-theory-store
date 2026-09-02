import { Minus, Plus, Trash } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";

const CartItem = ({ item }) => {
    const { removeFromCart, updateQuantity } = useCartStore();
    const variant = item.selectedVariant;

    return (
        <div className='rounded-lg border p-4 shadow-sm border-stone-700 bg-stone-800 md:p-6'>
            <div className='space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0'>
                <div className='shrink-0 md:order-1'>
                    <img className='h-20 md:h-32 rounded object-cover' src={variant?.image || item.image} alt={item.name} />
                </div>
                <label className='sr-only'>Choose quantity:</label>

                <div className='flex items-center justify-between md:order-3 md:justify-end'>
                    <div className='flex items-center gap-2'>
                        <button aria-label={`Decrease ${item.name} quantity`} className='inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-stone-600 bg-stone-700 hover:bg-stone-600 focus:outline-none focus:ring-2 focus:ring-yellow-500' onClick={() => updateQuantity(item._id, item.quantity - 1, item.variantId)}>
                            <Minus className='text-stone-300' size={14} />
                        </button>
                        <p>{item.quantity}</p>
                        <button aria-label={`Increase ${item.name} quantity`} className='inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-stone-600 bg-stone-700 hover:bg-stone-600 focus:outline-none focus:ring-2 focus:ring-yellow-500' onClick={() => updateQuantity(item._id, item.quantity + 1, item.variantId)}>
                            <Plus className='text-stone-300' size={14} />
                        </button>
                    </div>
                    <div className='text-end md:order-4 md:w-32'>
                        <p className='text-base font-bold text-yellow-400'>${Number(item.price).toFixed(2)}</p>
                    </div>
                </div>

                <div className='w-full min-w-0 flex-1 space-y-4 md:order-2 md:max-w-md'>
                    <p className='text-base font-medium text-white'>{item.name}</p>
                    {variant && <p className='text-sm font-medium text-yellow-400'>Variant: {variant.name}{variant.sku ? ` • SKU ${variant.sku}` : ""}</p>}
                    <p className='text-sm text-stone-400 line-clamp-2'>{item.description}</p>
                    <div className='flex items-center gap-4'>
                        <button aria-label={`Remove ${item.name}${variant ? ` ${variant.name}` : ""} from cart`} className='inline-flex items-center text-sm font-medium text-red-400 hover:text-red-300 hover:underline' onClick={() => removeFromCart(item._id, item.variantId)}>
                            <Trash size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default CartItem;
