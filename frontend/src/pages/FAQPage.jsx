const faqs = [
  ["How do I place an order?", "Add items to your cart, review your quantities, and continue to secure checkout. Your order is created after successful payment."],
  ["Can I track my order?", "Sign in and open Order History to view your orders and their current status."],
  ["What payment methods are accepted?", "Checkout is securely handled by Stripe. Available payment methods are shown at checkout."],
  ["Can I cancel an order?", "If you need to cancel an order, contact support as soon as possible. Orders that have already shipped may require a return instead."],
  ["How do returns work?", "See our Shipping & Returns page for the return window, eligibility, and the information we need to process your request."],
  ["How do I use a coupon?", "Enter an eligible coupon code during checkout. Coupons are validated by the store before the discount is applied."],
  ["Is my payment information stored?", "Payment processing is handled by Stripe; the store does not directly store your full card details."],
];

export default function FAQPage() {
  return <main className="max-w-4xl mx-auto px-4 py-12"><h1 className="text-4xl font-bold text-center">Frequently Asked Questions</h1><p className="text-stone-400 text-center mt-3 mb-10">Quick answers to common shopping and order questions.</p><div className="space-y-4">{faqs.map(([question, answer]) => <details key={question} className="bg-stone-800/80 border border-stone-700 rounded-xl p-5"><summary className="font-semibold cursor-pointer">{question}</summary><p className="text-stone-300 mt-3 leading-relaxed">{answer}</p></details>)}</div></main>;
}
