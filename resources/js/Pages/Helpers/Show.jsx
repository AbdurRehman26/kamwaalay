import { Link, useParams, useNavigate } from 'react-router-dom';
import PublicLayout from '@/Layouts/PublicLayout';
import { useEffect, useState } from 'react';
import { helpersService } from '@/services/helpers';
import { useAuth } from '@/contexts/AuthContext';
import { route } from '@/utils/routes';

export default function HelperShow() {
    const { helperId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [helper, setHelper] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const serviceListings = helper?.service_listings || [];
    const reviews = helper?.helper_reviews || [];

    useEffect(() => {
        if (helperId) {
            helpersService.getHelper(helperId)
                .then((data) => {
                    setHelper(data.helper);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error('Error fetching helper:', error);
                    setLoading(false);
                });
        }
    }, [helperId]);

    if (loading) {
        return (
            <PublicLayout>
                
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-gray-600">Loading helper profile...</p>
                </div>
            </PublicLayout>
        );
    }

    if (!helper) {
        return (
            <PublicLayout>
                
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-gray-600">Helper not found.</p>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            
            
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-shrink-0">
                            {helper.photo ? (
                                <img 
                                    src={`/storage/${helper.photo}`} 
                                    alt={helper.name} 
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center text-6xl border-4 border-white shadow-lg">
                                    👤
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold mb-2">{helper.name}</h1>
                            <p className="text-xl text-white/90 mb-4">{helper.bio || 'Professional helper'}</p>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center">
                                    <span className="text-yellow-300 text-2xl mr-2">⭐</span>
                                    <span className="text-2xl font-bold">{helper.rating || 0}</span>
                                    <span className="text-white/80 ml-2">({helper.total_reviews || 0} reviews)</span>
                                </div>
                                {helper.verification_status === 'verified' && (
                                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        ✓ Verified
                                    </span>
                                )}
                                {helper.police_verified && (
                                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        👮 Police Verified
                                    </span>
                                )}
                            </div>
                            {helper.service_listings && helper.service_listings.length > 0 && helper.service_listings[0].service_types && helper.service_listings[0].service_types.length > 0 && (
                                <p className="mt-4 text-lg capitalize">
                                    Primary Service: <span className="font-semibold">{helper.service_listings?.[0]?.service_types?.[0]?.service_type?.replace('_', ' ') || 'Service'}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Service Listings */}
                        {serviceListings && serviceListings.length > 0 && (
                            <div className="bg-white rounded-lg shadow-md p-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">Services Offered</h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {serviceListings.map((listing) => (
                                        <Link
                                            key={listing.id}
                                            to={route('service-listings.show', listing.id)}
                                            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-blue-300"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {listing.service_types && listing.service_types.length > 0 ? (
                                                        listing.service_types.map((serviceType, idx) => (
                                                            <span key={idx} className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full font-semibold capitalize">
                                                                {serviceType?.service_type?.replace('_', ' ') || 'Service'}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full font-semibold capitalize">
                                                            Service
                                                        </span>
                                                    )}
                                                </div>
                                                {listing.monthly_rate && (
                                                    <span className="text-lg font-bold text-green-600">
                                                        PKR {listing.monthly_rate}/month
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 capitalize">
                                                {listing.work_type?.replace('_', ' ') || 'Service'} Service
                                            </h3>
                                            {listing.locations && listing.locations.length > 0 && (
                                                <div className="text-sm text-gray-600 mb-3 space-y-1">
                                                    {listing.locations.map((location, idx) => (
                                                        <p key={idx}>
                                                            📍 {location.city}, {location.area}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                            {listing.description && (
                                                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                                    {listing.description}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-end">
                                                <span className="text-blue-600 font-semibold text-sm">View Details →</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                {serviceListings.length > 1 && (
                                    <p className="mt-4 text-sm text-gray-600 text-center">
                                        {helper.name} offers {serviceListings.length} different service{serviceListings.length !== 1 ? 's' : ''} across multiple locations
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Reviews Section */}
                        {reviews && reviews.length > 0 && (
                            <div className="bg-white rounded-lg shadow-md p-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">Reviews & Ratings</h2>
                                <div className="space-y-6">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center mr-3">
                                                        {review.user?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{review.user?.name || 'Anonymous'}</p>
                                                        <p className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex text-yellow-400">
                                                    {[...Array(5)].map((_, i) => (
                                                        <svg key={i} className={`w-5 h-5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.565-1.839-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                            </div>
                                            {review.comment && (
                                                <p className="text-gray-700">{review.comment}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Profile Info */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h3>
                            <div className="space-y-4">
                                {helper.experience_years && (
                                    <div>
                                        <p className="text-sm text-gray-600">Experience</p>
                                        <p className="font-semibold text-gray-900">{helper.experience_years} years</p>
                                    </div>
                                )}
                                {helper.skills && (
                                    <div>
                                        <p className="text-sm text-gray-600">Skills</p>
                                        <p className="font-semibold text-gray-900">{helper.skills}</p>
                                    </div>
                                )}
                                {helper.city && (
                                    <div>
                                        <p className="text-sm text-gray-600">Location</p>
                                        <p className="font-semibold text-gray-900">{helper.city}, {helper.area || 'N/A'}</p>
                                    </div>
                                )}
                                {helper.phone && (
                                    <div>
                                        <p className="text-sm text-gray-600">Phone</p>
                                        <p className="font-semibold text-gray-900">{helper.phone}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            {user ? (
                                <>
                                    <Link
                                        to={route('bookings.create', {
                                            service_type: helper.service_listings && helper.service_listings.length > 0 && helper.service_listings[0].service_types && helper.service_listings[0].service_types.length > 0 
                                                ? helper.service_listings[0].service_types[0].service_type 
                                                : null,
                                        })}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-center block mb-3"
                                    >
                                        Post Service Request
                                    </Link>
                                    {helper.phone && (
                                        <a
                                            to={`tel:${helper.phone}`}
                                            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-center block mb-3 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            Contact Helper
                                        </a>
                                    )}
                                </>
                            ) : (
                                <>
                                    {helper.phone && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigate(route('login'));
                                            }}
                                            className="w-full bg-gray-400 text-white px-6 py-3 rounded-lg cursor-not-allowed opacity-60 font-semibold text-center block mb-3 flex items-center justify-center gap-2 hover:bg-gray-500 transition-all duration-300"
                                            title="Please login to contact helper"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            Contact Helper
                                        </button>
                                    )}
                                    <Link
                                        to={route('login')}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-center block mb-3"
                                    >
                                        Login to Post Request
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}


