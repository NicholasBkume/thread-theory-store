import { useState } from "react";
import { Facebook, Instagram, Twitter, ChevronUp } from "lucide-react";
import CategoryItem from "../components/CategoryItem";

const categories = [
	{ href: "/category/jeans", name: "Jeans"},
	{ href: "/category/t-shirts", name: "T-shirts"},
	{ href: "/category/shoes", name: "Shoes" },
	{ href: "/category/glasses", name: "Glasses"},
	{ href: "/category/jackets", name: "Jackets" },
	{ href: "/category/suits", name: "Suits" },
	{ href: "/category/bags", name: "Bags" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    // TODO: integrate with your newsletter API endpoint
    try {
      // simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-stone-900 text-stone-300 pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* About */}
        <div>
          <h3 className="text-lg font-bold text-yellow-400 mb-4">About Us</h3>
          <p className="text-sm leading-relaxed">
            We’re a men’s fashion brand dedicated to sustainability, quality,
            and timeless style. Look good. Feel better.
          </p>
        </div>

        {/* Customer Service */}
        <nav aria-label="Customer Service">
          <h3 className="text-lg font-bold text-yellow-400 mb-4">
            Customer Service
          </h3>
          <ul className="text-sm space-y-2">
            <li>
              <a href="" className="hover:underline">
                Contact Us
              </a>
            </li>
            <li>
              <a href="" className="hover:underline">
                FAQ
              </a>
            </li>
            <li>
              <a href="" className="hover:underline">
                Shipping & Returns
              </a>
            </li>
            <li>
              <a href="" className="hover:underline">
                Support
              </a>
            </li>
          </ul>
        </nav>

        {/* Quick Links */}
        <nav aria-label="Quick Links">
  <h3 className="text-lg font-bold text-yellow-400 mb-4">
    Quick Links
  </h3>
  <ul className="text-sm space-y-2">
    {categories.map((category) => (
      <li key={category.name}>
        <a href={category.href} className="hover:underline">
          Shop {category.name}
        </a>
      </li>
    ))}
  </ul>
</nav>

        {/* Subscribe */}
        <div>
          <h3 className="text-lg font-bold text-yellow-400 mb-4">Subscribe</h3>
          <p className="text-sm mb-2">
            Stay in the loop with new drops and exclusive offers.
          </p>
          <form onSubmit={handleSubscribe} action="mailto:burinicholas@gmail.com?subject=Form%20Submission" className="flex flex-col sm:flex-row gap-2">
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              required
              className="w-full px-3 py-2 rounded-md text-black"
            />
            <button
              type="submit"
              className="bg-yellow-400 text-black px-4 py-2 rounded-md hover:bg-yellow-300 transition font-semibold"
            >
              Subscribe
            </button>
          </form>
          {status === 'success' && (
            <p className="mt-2 text-green-400 text-sm">Subscribed!</p>
          )}
          {status === 'error' && (
            <p className="mt-2 text-red-400 text-sm">Something went wrong.</p>
          )}
        </div>
      </div>

      {/* Social & Back to Top */}
      <div className="mt-10 border-t border-stone-700 pt-6 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-6 mb-4 md:mb-0">
          <a href="https://facebook.com" aria-label="Facebook" className="hover:text-white">
            <Facebook className="h-6 w-6" />
          </a>
          <a href="https://instagram.com" aria-label="Instagram" className="hover:text-white">
            <Instagram className="h-6 w-6" />
          </a>
          <a href="https://twitter.com" aria-label="Twitter" className="hover:text-white">
            <Twitter className="h-6 w-6" />
          </a>
        </div>
        <button onClick={scrollToTop} aria-label="Back to top" className="p-2 hover:bg-stone-700 rounded-full">
          <ChevronUp className="h-6 w-6 text-stone-400 hover:text-white" />
        </button>
      </div>

      <div className="mt-6 text-center text-xs text-stone-500 pb-4">
        &copy; {new Date().getFullYear()} Thread Theory. All rights reserved.
      </div>
    </footer>
  );
}
