import { useEffect, useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const ReviewModerationTab = () => {
    const [reviews, setReviews] = useState([]);
    const [status, setStatus] = useState("pending");
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try { const { data } = await axios.get(`/reviews?status=${status}`); setReviews(data.reviews || []); }
        catch (error) { toast.error(error.response?.data?.message || "Failed to load reviews"); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [status]);

    const moderate = async (id, nextStatus) => {
        try { const { data } = await axios.patch(`/reviews/${id}`, { status: nextStatus }); setReviews((items) => items.filter((item) => item._id !== id)); toast.success(`Review ${nextStatus}`); if (data.review?.status !== status) return; }
        catch (error) { toast.error(error.response?.data?.message || "Failed to update review"); }
    };
    const remove = async (id) => {
        if (!window.confirm("Delete this review permanently?")) return;
        try { await axios.delete(`/reviews/${id}`); setReviews((items) => items.filter((item) => item._id !== id)); toast.success("Review deleted"); }
        catch (error) { toast.error(error.response?.data?.message || "Failed to delete review"); }
    };

    return <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><h2 className="text-2xl font-semibold">Review Moderation</h2><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-stone-600 bg-stone-700 px-3 py-2"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
        {loading ? <p className="text-stone-400">Loading reviews…</p> : !reviews.length ? <p className="text-stone-400">No {status} reviews.</p> : <div className="space-y-4">{reviews.map((review) => <article key={review._id} className="rounded-lg border border-stone-700 bg-stone-800 p-5"><div className="flex flex-col sm:flex-row justify-between gap-3"><div><h3 className="font-semibold">{review.product?.name || "Deleted product"}</h3><p className="text-sm text-stone-400">{review.user?.name || "Customer"} · {review.user?.email || ""}</p></div><span className="text-yellow-400">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div>{review.title && <h4 className="mt-3 font-medium">{review.title}</h4>}<p className="mt-2 text-stone-300">{review.comment}</p>{review.verifiedPurchase && <p className="mt-2 text-xs text-green-400">Verified purchase</p>}<div className="mt-4 flex flex-wrap gap-2">{status !== "approved" && <button onClick={() => moderate(review._id, "approved")} className="inline-flex items-center gap-1 rounded bg-green-700 px-3 py-2 text-sm hover:bg-green-600"><Check size={16}/> Approve</button>}{status !== "rejected" && <button onClick={() => moderate(review._id, "rejected")} className="inline-flex items-center gap-1 rounded bg-orange-700 px-3 py-2 text-sm hover:bg-orange-600"><X size={16}/> Reject</button>}<button onClick={() => remove(review._id)} className="inline-flex items-center gap-1 rounded bg-red-700 px-3 py-2 text-sm hover:bg-red-600"><Trash2 size={16}/> Delete</button></div></article>)}</div>}
    </div>;
};
export default ReviewModerationTab;
