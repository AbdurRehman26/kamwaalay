// Head removed
import PublicLayout from "@/Layouts/PublicLayout";

export default function Terms() {
    return (
        <PublicLayout>

            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto prose prose-lg">
                    <h2 className="text-2xl font-bold mb-4">1. Service Agreement</h2>
                    <p className="text-gray-700 mb-6">
                        By using Kamwaalay, you agree to our terms of service. We connect households
                        with verified domestic helpers, facilitating the booking process.
                    </p>

                    <h2 className="text-2xl font-bold mb-4">2. User Responsibilities</h2>
                    <p className="text-gray-700 mb-6">
                        Users are responsible for providing accurate information during booking and
                        treating helpers with respect and dignity.
                    </p>

                    <h2 className="text-2xl font-bold mb-4">3. Helper Verification</h2>
                    <p className="text-gray-700 mb-6">
                        While we verify all helpers through background checks and document verification,
                        users should exercise their own judgment and conduct additional checks if needed.
                    </p>

                    <h2 className="text-2xl font-bold mb-4">4. Booking & Cancellation</h2>
                    <p className="text-gray-700 mb-6">
                        Bookings can be cancelled with 24 hours notice. Cancellation policies may vary
                        based on the service type and helper availability.
                    </p>

                    <h2 className="text-2xl font-bold mb-4">5. Liability</h2>
                    <p className="text-gray-700 mb-6">
                        Kamwaalay acts as a platform connecting users and helpers. We are not
                        responsible for any disputes between users and helpers.
                    </p>
                </div>
            </div>
        </PublicLayout>
    );
}

