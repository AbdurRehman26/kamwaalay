// Head removed
import PublicLayout from "@/Layouts/PublicLayout";
import { useState } from "react";

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            q: "How do I book a helper?",
            a: "Simply browse our verified helpers, select the one that matches your needs, and click \"Book Now\". Fill in the booking form with your requirements and submit.",
        },
        {
            q: "Are all helpers verified?",
            a: "Yes! All our helpers undergo thorough background checks including police verification and document verification before being listed.",
        },
        {
            q: "What if I'm not satisfied with the helper?",
            a: "We offer a free replacement guarantee. If you're not satisfied with your helper, contact us and we'll arrange a replacement at no extra cost.",
        },
        {
            q: "How do I pay for services?",
            a: "Payment can be made directly to the helper. Some helpers may accept online payments. Payment terms will be discussed during booking confirmation.",
        },
        {
            q: "Can I choose the helper's schedule?",
            a: "Yes! You can specify your preferred schedule (full-time or part-time) and timings when making a booking. The helper will confirm their availability.",
        },
        {
            q: "What services do you offer?",
            a: "We offer maids, cooks, babysitters, caregivers, cleaners, and all-rounders. Each helper has specific skills listed on their profile.",
        },
    ];

    return (
        <PublicLayout>

            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12 dark:bg-gray-900">
                <div className="max-w-3xl mx-auto space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border transaction-all duration-300 ${openIndex === index
                                    ? "border-indigo-600 dark:border-indigo-500 ring-1 ring-indigo-600 dark:ring-indigo-500"
                                    : "border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800"
                                }`}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full text-left p-6 flex justify-between items-center group"
                            >
                                <span className={`font-bold text-lg transition-colors duration-300 ${openIndex === index
                                        ? "text-indigo-600 dark:text-indigo-400"
                                        : "text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                                    }`}>
                                    {faq.q}
                                </span>
                                <span className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${openIndex === index
                                        ? "bg-indigo-600 text-white rotate-180"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                                    }`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </span>
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-6 pt-0">
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-4">
                                        {faq.a}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}

