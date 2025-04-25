import { motion } from "framer-motion";
import { Trash, Star, RefreshCw, Edit3, Upload, Loader } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import {  useState } from "react";
import UpdateProductForm from "./UpdateProductForm";

const ProductsList = () => {
	const { deleteProduct, toggleFeaturedProduct, products, updateProduct } = useProductStore(); //updateProduct,
	const [editingId, setEditingId] = useState(null);
	
	

	const startEditing = (id) => setEditingId(id);
	const stopEditing  = () => setEditingId(null);



	console.log("products", products);

	return (
		<motion.div
			className='bg-stone-800 shadow-lg rounded-lg overflow-hidden overflow-x-auto max-w-4xl mx-auto'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8 }}
		>
			<table className=' min-w-full divide-y divide-stone-700'>
				<thead className='bg-stone-700'>
					<tr>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-stone-300 uppercase tracking-wider'
						>
							Product
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-stone-300 uppercase tracking-wider'
						>
							Price
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-stone-300 uppercase tracking-wider'
						>
							Category
						</th>

						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-stone-300 uppercase tracking-wider'
						>
							Featured
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-stone-300 uppercase tracking-wider'
						>
							Actions
						</th>
					</tr>
				</thead>

				<tbody className='bg-stone-800 divide-y divide-stone-700'>
					{products?.map((product) => (
						<tr key={product._id} className='hover:bg-stone-700'>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='flex items-center'>
									<div className='flex-shrink-0 h-10 w-10'>
										<img
											className='h-10 w-10 rounded-full object-cover'
											src={product.image}
											alt={product.name}
										/>
									</div>
									<div className='ml-4'>
										<div className='text-sm font-medium text-white'>{product.name}</div>
									</div>
								</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='text-sm text-stone-300'>${product.price.toFixed(2)}</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='text-sm text-stone-300'>{product.category}</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<button
									onClick={() => toggleFeaturedProduct(product._id)}
									className={`p-1 rounded-full ${
										product.isFeatured ? "bg-yellow-400 text-stone-900" : "bg-stone-600 text-stone-300"
									} hover:bg-yellow-500 transition-colors duration-200`}
								>
									<Star className='h-5 w-5' />
								</button>
							</td>
							<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
							<button onClick={() => startEditing(product._id)} className="text-blue-400 hover:text-blue-300">
    						<Edit3 className="h-5 w-5" />
 							 </button>
							  

							
							{/* <button
									onClick={() => updateProduct(product._id)}
									className='text-green-400 hover:text-green-300'
								>
									<RefreshCw className='h-5 w-7' />
								</button> */}
								<button
									onClick={() => deleteProduct(product._id)}
									className='text-red-400 hover:text-red-300'
								>
									<Trash className='h-5 w-5' />
								</button>
								{editingId === product._id && (
								<tr>
									<td colSpan="4" className="bg-stone-800 p-4 shadow-sm rounded-lg">
									<UpdateProductForm
										initialData={product}
										onSubmit={(updated) => {
										updateProduct(product._id, updated);
										stopEditing();
										}}
										onCancel={stopEditing}
									/>
								</td>
								</tr>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</motion.div>
	);
};
export default ProductsList;
