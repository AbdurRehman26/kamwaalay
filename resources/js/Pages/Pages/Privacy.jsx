// Head removed
import PublicLayout from '@/Layouts/PublicLayout';

export default function Privacy() {
    return (
        <PublicLayout>
            
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto prose prose-lg">
                    <h2 className="text-2xl font-bold mb-4">Data Collection</h2>
                    <p className="text-gray-700 mb-6">
                        We collect personal information necessary to facilitate bookings and provide 
                        our services. This includes name, email, phone number, and address.
                    </p>

                    <h2 className="text-2xl font-bold mb-4">Data Usage</h2>
                    <p className="text-gray-700 mb-6">
                        Your data is used solely for service delivery, communication, and improving 
                        our platform. We never sell your personal information to third parties.
                    </p>

                    <h2 className="text-2xl font-bold mb-4">Data Security</h2>
                    <p className="text-gray-700 mb-6">
                        We implement industry-standard security measures to protect your data from 
                        unauthorized access, alteration, or disclosure.
                    </p>

                    <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
                    <p className="text-gray-700 mb-6">
                        You have the right to access, update, or delete your personal information 
                        at any time. Contact us for assistance.
                    </p>
                </div>
            </div>
        </PublicLayout>
    );
}

