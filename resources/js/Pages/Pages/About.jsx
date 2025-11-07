// Head removed
import PublicLayout from '@/Layouts/PublicLayout';

export default function About() {
    return (
        <PublicLayout>

            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
                <div className="container mx-auto px-4">
valet                     <h1 className="text-4xl font-bold mb-4">About Kamwaalay</h1>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="prose prose-lg">
                        <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                        <p className="text-gray-700 mb-8">
                            Kamwaalay connects households with trusted, verified domestic helpers.
                            We believe everyone deserves reliable home care services, and we're committed
                            to making the process simple, safe, and trustworthy.
                        </p>
                        <h2 className="text-3xl font-bold mb-6">Why Choose Us</h2>
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-blue-50 p-6 rounded-lg">
                                <h3 className="text-xl font-bold mb-2">Verified Helpers</h3>
                                <p className="text-gray-700">All our helpers undergo thorough background checks and verification.</p>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-lg">
                                <h3 className="text-xl font-bold mb-2">Quick Booking</h3>
                                <p className="text-gray-700">Find and book your perfect helper in minutes.</p>
                            </div>
                            <div className="bg-orange-50 p-6 rounded-lg">
                                <h3 className="text-xl font-bold mb-2">Free Replacement</h3>
                                <p className="text-gray-700">Not satisfied? Get a free replacement guarantee.</p>
                            </div>
                            <div className="bg-green-50 p-6 rounded-lg">
                                <h3 className="text-xl font-bold mb-2">24/7 Support</h3>
                                <p className="text-gray-700">Our team is always here to help you.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

