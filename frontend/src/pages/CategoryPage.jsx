import { useEffect, useMemo, useState } from "react";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { motion } from "framer-motion";
import { useParams, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useProductStore } from "../stores/useProductStore";

const CategoryPage = () => {
    const { category } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { fetchProductsByCategory, products, loading } = useProductStore();
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
    const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
    const [sort, setSort] = useState(searchParams.get("sort") || "featured");
    const [inStock, setInStock] = useState(searchParams.get("inStock") === "true");

    const params = useMemo(() => ({ search, minPrice, maxPrice, sort, ...(inStock ? { inStock: "true" } : {}) }), [search, minPrice, maxPrice, sort, inStock]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProductsByCategory(category, params);
            const next = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => { if (value !== "" && value !== "featured" && value !== undefined) next.set(key, value); });
            setSearchParams(next, { replace: true });
        }, search ? 300 : 0);
        return () => clearTimeout(timer);
    }, [category, params, fetchProductsByCategory, setSearchParams]);

    const clearFilters = () => { setSearch(""); setMinPrice(""); setMaxPrice(""); setSort("featured"); setInStock(false); };
    const categoryName = category ? category.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Shop";

    return <div className="min-h-screen">
        <div className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.h1 className="text-center text-4xl sm:text-5xl font-bold text-yellow-400 mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>Shop {categoryName}</motion.h1>
            <section aria-label="Product filters" className="bg-stone-800/80 border border-stone-700 rounded-xl p-4 mb-8">
                <div className="flex items-center gap-2 text-yellow-400 font-semibold mb-4"><SlidersHorizontal size={18} /> Filter & Sort</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <label className="lg:col-span-2 flex items-center gap-2 bg-stone-900 rounded-md px-3 py-2"><Search size={18} className="text-stone-400" /><span className="sr-only">Search products</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="w-full bg-transparent outline-none" /></label>
                    <label className="bg-stone-900 rounded-md px-3 py-2"><span className="sr-only">Minimum price</span><input type="number" min="0" step="0.01" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min price" className="w-full bg-transparent outline-none" /></label>
                    <label className="bg-stone-900 rounded-md px-3 py-2"><span className="sr-only">Maximum price</span><input type="number" min="0" step="0.01" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max price" className="w-full bg-transparent outline-none" /></label>
                    <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products" className="bg-stone-900 rounded-md px-3 py-2 outline-none"><option value="featured">Featured</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="price_asc">Price: Low to High</option><option value="price_desc">Price: High to Low</option><option value="name_asc">Name: A to Z</option><option value="name_desc">Name: Z to A</option></select>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4"><label className="flex items-center gap-2 text-sm text-stone-300 cursor-pointer"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="accent-yellow-400" /> In stock only</label><button type="button" onClick={clearFilters} className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center gap-1"><X size={16} /> Clear filters</button></div>
            </section>
            <div className="flex items-center justify-between mb-4 text-sm text-stone-400"><span>{loading ? "Loading products…" : `${products?.length || 0} product${products?.length === 1 ? "" : "s"} found`}</span><Filter size={17} /></div>
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {!loading && products?.length === 0 && <h2 className="text-3xl font-semibold text-stone-300 text-center col-span-full">No products match your filters.</h2>}
                {products?.map((product) => <ProductCard key={product._id} product={product} />)}
            </motion.div>
        </div>
    </div>;
};
export default CategoryPage;
