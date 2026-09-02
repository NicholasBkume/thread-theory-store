import { ShoppingCart, UserPlus, LogIn, LogOut, Lock, ShoppingBag, UserRound, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const Navbar = () => {
    const { user, logout } = useUserStore();
    const { cart } = useCartStore();
    const isAdmin = user?.role === "admin";
    return <header className='fixed top-0 left-0 w-full bg-stone-900 bg-opacity-90 backdrop-blur-md shadow-lg z-40 border-b border-yellow-800'>
        <div className='container mx-auto px-4 py-3'><div className='flex flex-wrap justify-between items-center'>
            <Link to='/' className='text-2xl font-bold text-yellow-400 items-center space-x-2 flex'><ShoppingBag className='mr-2' size={30}/>Thread Theory</Link>
            <nav className='flex flex-wrap items-center gap-4'>
                <Link to='/' className='text-stone-300 hover:text-yellow-400'>Home</Link>
                {user && <><Link to='/orders' className='text-stone-300 hover:text-yellow-400 flex items-center gap-1'><Package size={18}/><span className='hidden sm:inline'>Orders</span></Link><Link to='/account' className='text-stone-300 hover:text-yellow-400 flex items-center gap-1'><UserRound size={18}/><span className='hidden sm:inline'>Account</span></Link><Link to='/cart' className='relative text-stone-300 hover:text-yellow-400'><ShoppingCart className='inline-block mr-1' size={20}/><span className='hidden sm:inline'>Cart</span>{cart.length > 0 && <span className='absolute -top-2 -left-2 bg-yellow-500 text-white rounded-full px-2 py-0.5 text-xs'>{cart.length}</span>}</Link></>}
                {isAdmin && <Link className='bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1 rounded-md font-medium flex items-center' to='/secret-dashboard'><Lock className='mr-1' size={18}/>Dashboard</Link>}
                {user ? <button className='bg-stone-700 hover:bg-stone-600 text-white py-2 px-4 rounded-md flex items-center' onClick={logout}><LogOut size={18}/><span className='hidden sm:inline ml-2'>Log Out</span></button> : <><Link to='/signup' className='bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md flex items-center'><UserPlus className='mr-2' size={18}/>Sign Up</Link><Link to='/login' className='bg-stone-700 hover:bg-stone-600 text-white py-2 px-4 rounded-md flex items-center'><LogIn className='mr-2' size={18}/>Login</Link></>}
            </nav>
        </div></div>
    </header>;
};
export default Navbar;
