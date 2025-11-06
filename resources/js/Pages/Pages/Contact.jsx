// Head removed
import PublicLayout from '@/Layouts/PublicLayout';
import { useState } from 'react';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        // In a real app, you'd send this to your backend API
        try {
            // await contactService.sendMessage(formData);
            setSubmitted(true);
        } catch (error) {
            setErrors(error.response?.data?.errors || {});
        } finally {
            setProcessing(false);
        }
    };

    return (
        <PublicLayout>

            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
                    <p className="text-xl text-white/90">We'd love to hear from you</p>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto">
                    {submitted ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                            <h3 className="text-xl font-bold text-green-800 mb-2">Thank You!</h3>
                            <p className="text-green-700">We'll get back to you soon.</p>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="bg-white rounded-lg shadow-md p-8">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full border-gray-300 rounded-lg focus:border-purple-500 focus:ring-purple-500"
                                    required
                                />
                                {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full border-gray-300 rounded-lg focus:border-purple-500 focus:ring-purple-500"
                                    required
                                />
                                {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="w-full border-gray-300 rounded-lg focus:border-purple-500 focus:ring-purple-500"
                                />
                                {errors.phone && <div className="text-red-500 text-sm mt-1">{errors.phone}</div>}
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                <textarea
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    rows={6}
                                    className="w-full border-gray-300 rounded-lg focus:border-purple-500 focus:ring-purple-500"
                                    required
                                />
                                {errors.message && <div className="text-red-500 text-sm mt-1">{errors.message}</div>}
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition duration-300 font-semibold"
                            >
                                Send Message
                            </button>
                        </form>
                    )}
                    <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
                        <div>
                            <div className="text-3xl mb-2">📧</div>
                            <h3 className="font-bold mb-2">Email</h3>
                            <p className="text-gray-600">contact@kamwaalay.com</p>
                        </div>
                        <div>
                            <div className="text-3xl mb-2">📞</div>
                            <h3 className="font-bold mb-2">Phone</h3>
                            <p className="text-gray-600">+91 1234567890</p>
                        </div>
                        <div>
                            <div className="text-3xl mb-2">📍</div>
                            <h3 className="font-bold mb-2">Address</h3>
                            <p className="text-gray-600">Mumbai, India</p>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

