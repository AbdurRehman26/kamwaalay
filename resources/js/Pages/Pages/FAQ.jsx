// Head removed
import PublicLayout from '@/Layouts/PublicLayout';
import { useState } from 'react';

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            q: 'How do I book a helper?',
            a: 'Simply browse our verified helpers, select the one that matches your needs, and click "Book Now". Fill in the booking form with your requirements and submit.',
        },
        {
            q: 'Are all helpers verified?',
            a: 'Yes! All our helpers undergo thorough background checks including police verification and document verification before being listed.',
        },
        {
            q: 'What if I\'m not satisfied with the helper?',
            a: 'We offer a free replacement guarantee. If you\'re not satisfied with your helper, contact us and we\'ll arrange a replacement at no extra cost.',
        },
        {
            q: 'How do I pay for services?',
            a: 'Payment can be made directly to the helper. Some helpers may accept online payments. Payment terms will be discussed during booking confirmation.',
        },
        {
            q: 'Can I choose the helper\'s schedule?',
            a: 'Yes! You can specify your preferred schedule (full-time or part-time) and timings when making a booking. The helper will confirm their availability.',
        },
        {
            q: 'What services do you offer?',
            a: 'We offer maids, cooks, babysitters, caregivers, cleaners, and all-rounders. Each helper has specific skills listed on their profile.',
        },
    ];

    return (
        <PublicLayout>
            
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-50 transition duration-300"
                            >
                                <span className="font-semibold text-lg">{faq.q}</span>
                                <span className="text-purple-600 text-2xl">
                                    {openIndex === index ? '−' : '+'}
                                </span>
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-6 text-gray-700">{faq.a}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}

