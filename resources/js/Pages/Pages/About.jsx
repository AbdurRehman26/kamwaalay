// Head removed
import PublicLayout from "@/Layouts/PublicLayout";

export default function About() {
    return (
        <PublicLayout>

            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">About Kamwaalay</h1>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto">
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Our Mission</h2>
                            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                                Kamwaalay connects households with trusted, verified domestic helpers.
                                We believe everyone deserves reliable home care services, and we're committed
                                to making the process simple, safe, and trustworthy.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Why Choose Us</h2>
                            <div className="grid md:grid-cols-2 gap-6 not-prose">
                                <div className="bg-gradient-to-br from-indigo-50 to-primary-50 dark:from-gray-800 dark:to-gray-800 p-8 rounded-2xl border border-indigo-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-4xl mb-4">🛡️</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Verified Helpers</h3>
                                    <p className="text-gray-600 dark:text-gray-400">All our helpers undergo thorough background checks and verification ensuring your safety.</p>
                                </div>
                                <div className="bg-gradient-to-br from-indigo-50 to-primary-50 dark:from-gray-800 dark:to-gray-800 p-8 rounded-2xl border border-indigo-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-4xl mb-4">⚡</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Quick Booking</h3>
                                    <p className="text-gray-600 dark:text-gray-400">Find and book your perfect helper in minutes with our easy-to-use platform.</p>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-800 dark:to-gray-800 p-8 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-4xl mb-4">🔄</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Free Replacement</h3>
                                    <p className="text-gray-600 dark:text-gray-400">Not satisfied? Get a free replacement guarantee within the first week of service.</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 p-8 rounded-2xl border border-green-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-4xl mb-4">💬</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">24/7 Support</h3>
                                    <p className="text-gray-600 dark:text-gray-400">Our dedicated support team is always available to help you with any queries.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

