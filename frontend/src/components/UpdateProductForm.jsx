import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const categories = ["jeans", "t-shirts", "shoes", "glasses", "jackets", "suits", "bags"];
export default function UpdateProductForm({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState({ ...initialData });

  const { loading } = useProductStore();
  

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onloadend = () => {
            setForm({ ...form, image: reader.result });
        };

        reader.readAsDataURL(file); // base64
    }
};


  return (
    <motion.div
			className='bg-stone-800 shadow-lg rounded-md p-8 mb-8 max-w-xl mx-auto'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8 }}
		>
    <form
      className="space-y-4"
      onSubmit={e => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <div>
        <label>Name</label>
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className='mt-1 block w-full bg-stone-700 border border-stone-600 rounded-md shadow-sm py-2
						 px-3 text-white focus:outline-none focus:ring-2
						focus:ring-yellow-500 focus:border-yellow-500'
						required
        />
      </div>
      <div>
					<label htmlFor='description' className='block text-sm font-medium text-stone-300'>
						Description
					</label>
					<textarea
						
						value={form.description}
						onChange={(e) => setForm({ ...form, description: e.target.value })}
						rows='3'
						className='mt-1 block w-full bg-stone-700 border border-stone-600 rounded-md shadow-sm
						 py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 
						 focus:border-yellow-500'
						required
					/>
				</div>
      <div>
        <label>Price</label>
        <input
          type="number"
          value={form.price}
          onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}
          className='mt-1 block w-full bg-stone-700 border border-stone-600 rounded-md shadow-sm 
						py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500
						 focus:border-yellow-500'
						required
        />
      </div>
      <div>
					<label htmlFor='category' className='block text-sm font-medium text-stone-300'>
						Category
					</label>
					<select
						id='category'
						name='category'
						value={form.category}
						onChange={(e) => setForm({ ...form, category: e.target.value })}
						className='mt-1 block w-full bg-stone-700 border border-stone-600 rounded-md
						 shadow-sm py-2 px-3 text-white focus:outline-none 
						 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500'
						required
					>
						<option value=''>Select a category</option>
						{categories.map((category) => (
							<option key={category} value={category}>
								{category}
							</option>
						))}
					</select>
				</div>

                <div className='mt-1 flex items-center'>
					<input type='file' id='image' className='sr-only' accept='image/*' onChange={handleImageChange} />
					<label
						htmlFor='image'
						className='cursor-pointer bg-stone-700 py-2 px-3 border border-stone-600 rounded-md shadow-sm text-sm leading-4 font-medium text-stone-300 hover:bg-stone-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500'
					>
						<Upload className='h-5 w-5 inline-block mr-2' />
						Upload Image
					</label>
					{ typeof form.image === "string" && form.image.startsWith("data:") && (<span className='ml-3 text-sm text-stone-400'>Image uploaded </span>)}
				</div>
      <div className="flex space-x-2">
      <button
					type='submit'
					className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md 
					shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 
					focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50'
					disabled={loading}
				>
                    {loading ? (
						<>
							<Loader className='mr-2 h-5 w-5 animate-spin' aria-hidden='true' />
							Loading...
						</>
					) : (
						<>
							<PlusCircle className='mr-2 h-5 w-5' />
							Apply
						</>
					)} </button>
        <button type="button" onClick={onCancel} className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md 
					shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 
					focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50'>Cancel</button>
      </div>
    </form>
    </motion.div>
  );
}