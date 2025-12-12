import PublicLayout from "@/Layouts/PublicLayout";
import { useState } from "react";
import { contactService } from "@/services/contact";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";

export default function Contact() {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        message: "",
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            await contactService.sendMessage(formData);
            setSubmitted(true);
            // Reset form
            setFormData({
                name: "",
                phone: "",
                message: "",
            });
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ message: [error.response?.data?.message || "Failed to send message. Please try again."] });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <PublicLayout>

            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
                    <p className="text-xl text-white/90">We'd love to hear from you</p>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12 dark:bg-gray-900">
                <div className="max-w-2xl mx-auto">
                    {submitted ? (
                        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-2xl p-8 text-center shadow-sm">
                            <div className="text-4xl mb-4">✅</div>
                            <h3 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">Message Sent!</h3>
                            <p className="text-green-700 dark:text-green-400">Thank you for contacting us. We'll get back to you shortly.</p>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
                            <div className="mb-6">
                                <InputLabel htmlFor="name" value="Name" className="text-gray-700 dark:text-gray-300 font-bold mb-2" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-2 block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div className="mb-6">
                                <InputLabel htmlFor="phone" value="Phone (Optional)" className="text-gray-700 dark:text-gray-300 font-bold mb-2" />
                                <TextInput
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="mt-2 block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                                    placeholder="+92 300 1234567"
                                />
                                <InputError message={errors.phone} className="mt-2" />
                            </div>
                            <div className="mb-6">
                                <InputLabel htmlFor="message" value="Message" className="text-gray-700 dark:text-gray-300 font-bold mb-2" />
                                <textarea
                                    id="message"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    rows={6}
                                    className="mt-2 block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                                    required
                                />
                                <InputError message={errors.message} className="mt-2" />
                            </div>
                            <PrimaryButton
                                type="submit"
                                disabled={processing}
                                className="w-full justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-indigo-500/30 disabled:opacity-75"
                            >
                                {processing ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Sending...</span>
                                    </div>
                                ) : "Send Message"}
                            </PrimaryButton>
                        </form>
                    )}
                    <div className="mt-12 grid md:grid-cols-3 gap-6">
                        <a href="mailto:contact@kamwaalay.com" className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 mx-auto bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📧</div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Email</h3>
                            <p className="text-indigo-600 dark:text-indigo-400 font-medium group-hover:underline">
                                contact@kamwaalay.com
                            </p>
                        </a>
                        <a href="tel:+923001234567" className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 mx-auto bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📞</div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Phone</h3>
                            <p className="text-green-600 dark:text-green-400 font-medium group-hover:underline">
                                +92 300 1234567
                            </p>
                        </a>
                        <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 mx-auto bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📍</div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Address</h3>
                            <p className="text-gray-600 dark:text-gray-400">Karachi, Pakistan</p>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

