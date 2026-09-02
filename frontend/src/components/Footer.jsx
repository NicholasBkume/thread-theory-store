import { useState } from "react";
import { Facebook, Instagram, Twitter, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import CategoryItem from "../components/CategoryItem";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";

const categories = [
  { href: "/category/jeans", name: "Jeans" }, { href: "/category/t-shirts", name: "T-shirts" },
  { href: "/category/shoes", name: "Shoes" }, { href: "/category/glasses", name: "Glasses" },
  { href: "/category/jackets", name: "Jackets" }, { href: "/category/suits", name: "Suits" }, { href: "/category/bags", name: "Bags" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axiosInstance.post("/support/subscribe", { email });
      toast.success(data.message);
      setEmail("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to subscribe right now");
    } finally { setLoading(false); }
  };

  return <footer className="bg-stone-900 text-stone-300 pt-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <div><h3 className="text-lg font-bold text-yellow-400 mb-4">About Us</h3><p className="text-sm leading-relaxed">We’re a men’s fashion brand dedicated to sustainability, quality, and timeless style. Look good. Feel better.</p></div>
      <nav aria-label="Customer Service"><h3 className="text-lg font-bold text-yellow-400 mb-4">Customer Service</h3><ul className="text-sm space-y-2">
        <li><Link to="/contact" className="hover:underline">Contact Us</Link></li><li><Link to="/faq" className="hover:underline">FAQ</Link></li><li><Link to="/shipping-returns" className="hover:underline">Shipping & Returns</Link></li><li><Link to="/support" className="hover:underline">Support</Link></li>
      </ul></nav>
      <nav aria-label="Quick Links"><h3 className="text-lg font-bold text-yellow-400 mb-4">Quick Links</h3><ul className="text-sm space-y-2">{categories.map((category) => <li key={category.name}><Link to={category.href} className="hover:underline">Shop {category.name}</Link></li>)}</ul></nav>
      <div><h3 className="text-lg font-bold text-yellow-400 mb-4">Subscribe</h3><p className="text-sm mb-2">Stay in the loop with new drops and exclusive offers.</p><form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2"><label htmlFor="footer-email" className="sr-only">Email address</label><input id="footer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" required maxLength={254} className="w-full px-3 py-2 rounded-md text-black" /><button type="submit" disabled={loading} className="bg-yellow-400 text-black px-4 py-2 rounded-md hover:bg-yellow-300 transition font-semibold disabled:opacity-50">{loading ? "Joining…" : "Subscribe"}</button></form></div>
    </div>
    <div className="mt-10 border-t border-stone-700 pt-6 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex space-x-6 mb-4 md:mb-0"><a href="https://facebook.com" aria-label="Facebook" className="hover:text-white"><Facebook className="h-6 w-6" /></a><a href="https://instagram.com" aria-label="Instagram" className="hover:text-white"><Instagram className="h-6 w-6" /></a><a href="https://twitter.com" aria-label="Twitter" className="hover:text-white"><Twitter className="h-6 w-6" /></a></div><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top" className="p-2 hover:bg-stone-700 rounded-full"><ChevronUp className="h-6 w-6 text-stone-400 hover:text-white" /></button></div>
    <div className="mt-6 text-center text-xs text-stone-500 pb-4">&copy; {new Date().getFullYear()} Thread Theory. All rights reserved.</div>
  </footer>;
}
