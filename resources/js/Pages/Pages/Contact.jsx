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

            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
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
                                <InputLabel htmlFor="name" value="Name" className="text-gray-700 font-medium" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div className="mb-6">
                                <InputLabel htmlFor="phone" value="Phone (Optional)" className="text-gray-700 font-medium" />
                                <TextInput
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="+92 300 1234567"
                                />
                                <InputError message={errors.phone} className="mt-2" />
                            </div>
                            <div className="mb-6">
                                <InputLabel htmlFor="message" value="Message" className="text-gray-700 font-medium" />
                                <textarea
                                    id="message"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    rows={6}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                                <InputError message={errors.message} className="mt-2" />
                            </div>
                            <PrimaryButton
                                type="submit"
                                disabled={processing}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition duration-300 font-semibold shadow-lg hover:shadow-xl"
                            >
                                {processing ? "Sending..." : "Send Message"}
                            </PrimaryButton>
                        </form>
                    )}
                    <div className="mt-12 grid md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg shadow-md p-6 text-center">
                            <div className="text-4xl mb-3">📧</div>
                            <h3 className="font-bold text-gray-900 mb-2">Email</h3>
                            <a href="mailto:contact@kamwaalay.com" className="text-blue-600 hover:text-blue-800 transition-colors">
                                contact@kamwaalay.com
                            </a>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6 text-center">
                            <div className="text-4xl mb-3">📞</div>
                            <h3 className="font-bold text-gray-900 mb-2">Phone</h3>
                            <a href="tel:+923001234567" className="text-blue-600 hover:text-blue-800 transition-colors">
                                +92 300 1234567
                            </a>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6 text-center">
                            <div className="text-4xl mb-3">📍</div>
                            <h3 className="font-bold text-gray-900 mb-2">Address</h3>
                            <p className="text-gray-600">Karachi, Pakistan</p>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

