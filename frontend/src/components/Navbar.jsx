import { useEffect, useState } from "react";
import { ShoppingCart, UserPlus, LogIn, LogOut, Lock, ShoppingBag, UserRound, Package, Search, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useNotificationStore } from "../stores/useNotificationStore";

const Navbar = () => {
    const { user, logout } = useUserStore();
    const { cart } = useCartStore();
    const { notifications, unread, fetchNotifications, markRead, markAllRead } = useNotificationStore();
    const isAdmin = user?.role === "admin";
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user, fetchNotifications]);

    const submitSearch = (e) => {
        e.preventDefault();
        const q = query.trim();
        navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    };

    return (
        <header className="fixed top-0 left-0 w-full bg-stone-900 bg-opacity-90 backdrop-blur-md shadow-lg z-40 border-b border-yellow-800">
            <div className="container mx-auto px-4 py-3">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <Link to="/" className="text-2xl font-bold text-yellow-400 items-center space-x-2 flex">
                        <ShoppingBag className="mr-2" size={30} />Thread Theory
                    </Link>

                    <form onSubmit={submitSearch} className="order-3 md:order-2 w-full md:w-auto md:flex-1 md:max-w-sm flex items-center bg-stone-800 rounded-md border border-stone-700 px-2">
                        <Search size={17} className="text-stone-400" />
                        <label htmlFor="nav-search" className="sr-only">Search products</label>
                        <input id="nav-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="w-full bg-transparent px-2 py-2 text-sm outline-none" />
                        <button type="submit" aria-label="Submit product search" className="rounded px-2 py-1 text-xs font-semibold text-yellow-400 hover:bg-stone-700">
                            Search
                        </button>
                    </form>

                    <nav className="order-2 md:order-3 flex flex-wrap items-center gap-3">
                        <Link to="/" className="text-stone-300 hover:text-yellow-400">Home</Link>
                        <Link to="/search" className="text-stone-300 hover:text-yellow-400 flex items-center gap-1">
                            <Search size={18} />
                            <span>Search</span>
                        </Link>
                        {user && <>
                            <Link to="/orders" className="text-stone-300 hover:text-yellow-400 flex items-center gap-1"><Package size={18} /><span className="hidden sm:inline">Orders</span></Link>
                            <Link to="/account" className="text-stone-300 hover:text-yellow-400 flex items-center gap-1"><UserRound size={18} /><span className="hidden sm:inline">Account</span></Link>
                            <div className="relative">
                                <button onClick={() => setOpen((v) => !v)} aria-label="Notifications" className="relative text-stone-300 hover:text-yellow-400 p-1">
                                    <Bell size={20} />
                                    {unread > 0 && <span className="absolute -right-1 -top-1 bg-yellow-500 text-stone-900 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{unread}</span>}
                                </button>
                                {open && <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-lg border border-stone-700 bg-stone-900 shadow-xl p-3 z-50">
                                    <div className="flex items-center justify-between mb-2"><strong>Notifications</strong>{unread > 0 && <button onClick={markAllRead} className="text-xs text-yellow-400">Mark all read</button>}</div>
                                    <div className="max-h-80 overflow-auto space-y-2">
                                        {!notifications.length && <p className="text-sm text-stone-400 p-3">No notifications yet.</p>}
                                        {notifications.map((n) => <button key={n._id} onClick={() => markRead(n._id)} className={`block w-full text-left rounded p-3 ${n.read ? "bg-stone-800" : "bg-stone-700"}`}><div className="font-medium text-sm">{n.title}</div><div className="text-xs text-stone-400 mt-1">{n.message}</div></button>)}
                                    </div>
                                </div>}
                            </div>
                            <Link to="/cart" className="relative text-stone-300 hover:text-yellow-400"><ShoppingCart className="inline-block mr-1" size={20} /><span className="hidden sm:inline">Cart</span>{cart.length > 0 && <span className="absolute -top-2 -left-2 bg-yellow-500 text-white rounded-full px-2 py-0.5 text-xs">{cart.length}</span>}</Link>
                        </>}
                        {isAdmin && <Link className="bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1 rounded-md font-medium flex items-center" to="/secret-dashboard"><Lock className="mr-1" size={18} />Dashboard</Link>}
                        {user ? <button className="bg-stone-700 hover:bg-stone-600 text-white py-2 px-4 rounded-md flex items-center" onClick={logout}><LogOut size={18} /><span className="hidden sm:inline ml-2">Log Out</span></button> : <><Link to="/signup" className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md flex items-center"><UserPlus className="mr-2" size={18} />Sign Up</Link><Link to="/login" className="bg-stone-700 hover:bg-stone-600 text-white py-2 px-4 rounded-md flex items-center"><LogIn className="mr-2" size={18} />Login</Link></>}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
