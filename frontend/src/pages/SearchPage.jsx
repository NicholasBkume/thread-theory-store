import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useProductStore } from "../stores/useProductStore";

export default function SearchPage() {
    const [params, setParams] = useSearchParams();
    const initial = params.get("q") || "";
    const [query, setQuery] = useState(initial);
    const { products, loading, fetchAllProducts } = useProductStore();
    useEffect(() => { const q = params.get("q") || ""; setQuery(q); fetchAllProducts({ search: q, sort: "featured" }); }, [params, fetchAllProducts]);
    const submit = (e) => { e.preventDefault(); const next = new URLSearchParams(); if (query.trim()) next.set("q", query.trim()); setParams(next); };
    return <main className="container mx-auto min-h-screen px-4 py-12"><h1 className="text-4xl font-bold text-yellow-400 text-center mb-8">Search Thread Theory</h1><form onSubmit={submit} className="max-w-2xl mx-auto flex gap-2 mb-10"><label className="flex-1 flex items-center gap-2 rounded-md bg-stone-800 border border-stone-700 px-3"><SearchIcon size={20} className="text-stone-400"/><span className="sr-only">Search products</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="w-full bg-transparent py-3 outline-none"/></label><button className="rounded-md bg-yellow-500 px-5 font-semibold text-black hover:bg-yellow-400">Search</button></form>{params.get("q") && <p className="mb-5 text-stone-400">{loading ? "Searching…" : `${products.length} result${products.length === 1 ? "" : "s"} for “${params.get("q") }”`}</p>}<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{!loading && !products.length && <p className="col-span-full text-center text-stone-400">No products found.</p>}{products.map((product) => <ProductCard key={product._id} product={product}/>)}</div></main>;
}
