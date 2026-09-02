import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
const categories = ["jeans", "t-shirts", "shoes", "glasses", "jackets", "suits", "bags"];
export default function UpdateProductForm({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState({ ...initialData, stock: initialData.stock ?? 0, lowStockThreshold: initialData.lowStockThreshold ?? 5 });
  const { loading } = useProductStore();
  const handleImageChange = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onloadend = () => setForm({ ...form, image: reader.result }); reader.readAsDataURL(file); };
  return <motion.div className='bg-stone-800 shadow-lg rounded-md p-8 mb-8 max-w-xl mx-auto' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}><form className='space-y-4' onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
    <input value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} placeholder='Name' className='w-full rounded-md border border-stone-600 bg-stone-700 px-3 py-2 text-white' required/>
    <textarea value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} placeholder='Description' className='w-full rounded-md border border-stone-600 bg-stone-700 px-3 py-2 text-white' rows='3' required/>
    <div className='grid grid-cols-2 gap-3'><label className='text-sm text-stone-300'>Price<input type='number' step='0.01' min='0' value={form.price} onChange={(e) => setForm({...form,price:+e.target.value})} className='mt-1 w-full rounded-md border border-stone-600 bg-stone-700 px-3 py-2 text-white' required/></label><label className='text-sm text-stone-300'>Stock<input type='number' min='0' step='1' value={form.stock} onChange={(e) => setForm({...form,stock:+e.target.value})} className='mt-1 w-full rounded-md border border-stone-600 bg-stone-700 px-3 py-2 text-white' required/></label></div>
    <label className='text-sm text-stone-300'>Low-stock threshold<input type='number' min='0' step='1' value={form.lowStockThreshold} onChange={(e) => setForm({...form,lowStockThreshold:+e.target.value})} className='mt-1 w-full rounded-md border border-stone-600 bg-stone-700 px-3 py-2 text-white'/></label>
    <select value={form.category} onChange={(e) => setForm({...form,category:e.target.value})} className='w-full rounded-md border border-stone-600 bg-stone-700 px-3 py-2 text-white' required><option value=''>Select a category</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
    <div><input type='file' id='update-image' className='sr-only' accept='image/*' onChange={handleImageChange}/><label htmlFor='update-image' className='cursor-pointer rounded-md bg-stone-700 px-3 py-2 text-sm text-stone-300'><Upload className='mr-2 inline h-5 w-5'/>Upload Image</label></div>
    <div className='flex gap-2'><button disabled={loading} className='flex w-full justify-center rounded-md bg-yellow-600 px-4 py-2 text-white disabled:opacity-50'>{loading ? <Loader className='animate-spin'/> : <><PlusCircle className='mr-2'/>Apply</>}</button><button type='button' onClick={onCancel} className='w-full rounded-md bg-stone-700 px-4 py-2 text-white'>Cancel</button></div>
  </form></motion.div>;
}
