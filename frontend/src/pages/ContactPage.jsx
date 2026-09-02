import { useState } from "react";
import { Mail, Send } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../lib/axios";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axiosInstance.post("/support/contact", form);
      toast.success(data.message);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send your message");
    } finally {
      setLoading(false);
    }
  };

  return <main className="max-w-3xl mx-auto px-4 py-12">
    <div className="text-center mb-10"><Mail className="mx-auto h-10 w-10 text-yellow-400 mb-3" /><h1 className="text-4xl font-bold">Contact Us</h1><p className="text-stone-400 mt-2">Have a question about an order, product, or return? We’re here to help.</p></div>
    <form onSubmit={submit} className="space-y-5 bg-stone-800/80 p-6 rounded-xl border border-stone-700">
      <div className="grid sm:grid-cols-2 gap-5">
        <input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="bg-stone-900 rounded-md px-4 py-3" />
        <input required type="email" maxLength={254} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="bg-stone-900 rounded-md px-4 py-3" />
      </div>
      <input required maxLength={150} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="w-full bg-stone-900 rounded-md px-4 py-3" />
      <textarea required maxLength={5000} rows={7} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" className="w-full bg-stone-900 rounded-md px-4 py-3 resize-y" />
      <button disabled={loading} className="w-full bg-yellow-400 text-black font-semibold py-3 rounded-md hover:bg-yellow-300 disabled:opacity-50 flex items-center justify-center gap-2">{loading ? "Sending…" : <><Send className="h-4 w-4" /> Send Message</>}</button>
    </form>
  </main>;
}
