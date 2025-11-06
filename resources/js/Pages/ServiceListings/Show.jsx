import { Link, useParams } from 'react-router-dom';
import PublicLayout from '@/Layouts/PublicLayout';
import { useState, useEffect } from 'react';
import { serviceListingsService } from '@/services/serviceListings';
import { useAuth } from '@/contexts/AuthContext';
import { route } from '@/utils/routes';

export default function ServiceListingShow() {
    const { listingId } = useParams();
    const { user } = useAuth();
    const [listing, setListing] = useState(null);
    const [otherListings, setOtherListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (listingId) {
            serviceListingsService.getListing(listingId)
                .then((data) => {
                    setListing(data.listing);
                    setOtherListings(data.other_listings || []);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error('Error fetching listing:', err);
                    setError(err.response?.data?.message || 'Failed to load listing');
                    setLoading(false);
                });
        }
    }, [listingId]);

    if (loading) {
        return (
            <PublicLayout>
                
                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-gray-600">Loading listing details...</p>
                </div>
            </PublicLayout>
        );
    }

    if (error || !listing) {
        return (
            <PublicLayout>
                
                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-red-600">{error || 'Listing not found'}</p>
                    <Link
                        to={route('service-listings.index')}
                        className="mt-4 inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold"
                    >
                        Back to Listings
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">{listing.service_type_label}</h1>
                    <p className="text-xl text-white/90">Service offered by {listing.user?.name}</p>
                    {otherListings && otherListings.length > 0 && (
                        <p className="text-lg text-white/80 mt-2">
                            This provider offers {otherListings.length} other service{otherListings.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Service Provider</h3>
                                <p className="text-gray-900 font-bold text-xl">{listing.user?.name}</p>
                                {listing.user?.phone && (
                                    <p className="text-gray-600">📞 {listing.user.phone}</p>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Work Type</h3>
                                <p className="text-gray-900 capitalize">{listing.work_type?.replace('_', ' ') || 'N/A'}</p>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">Location</h3>
                                <p className="text-gray-900">
                                    {listing.locations && listing.locations.length > 0 
                                        ? `${listing.locations[0].city}, ${listing.locations[0].area}`
                                        : 'Location not specified'}
                                </p>
                            </div>
                        </div>
                        {listing.monthly_rate && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <p className="text-3xl font-bold text-green-600">PKR {listing.monthly_rate}/month</p>
                            </div>
                        )}
                        {listing.description && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Description</h3>
                                <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
                            </div>
                        )}
                    </div>
                    {auth?.user && (
                        <div className="text-center space-y-3">
                            <Link
                                to={route('bookings.create', {
                                    service_type: listing.service_types && listing.service_types.length > 0 ? listing.service_types[0].service_type : null,
                                    work_type: listing.work_type,
                                    city: listing.locations && listing.locations.length > 0 ? listing.locations[0].city : null,
                                    area: listing.locations && listing.locations.length > 0 ? listing.locations[0].area : null,
                                })}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg inline-block"
                            >
                                Request This Service
                            </Link>
                            {listing.user?.phone && (
                                <a
                                    to={`tel:${listing.user.phone}`}
                                    className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg inline-flex items-center gap-2 mx-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Contact Provider
                                </a>
                            )}
                        </div>
                    )}
                    {!auth?.user && (
                        <div className="text-center space-y-3">
                            {listing.user?.phone && (
                                <a
                                    to={`tel:${listing.user.phone}`}
                                    className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg inline-flex items-center gap-2 mx-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Contact Provider
                                </a>
                            )}
                            <Link
                                to={route('login')}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg inline-block"
                            >
                                Login to Request This Service
                            </Link>
                        </div>
                    )}
                    
                    {/* Other Services from Same Provider */}
                    {otherListings && otherListings.length > 0 && (
                        <div className="mt-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Other Services by {listing.user?.name}</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {otherListings.map((otherListing) => (
                                    <Link
                                        key={otherListing.id}
                                        to={route('service-listings.show', otherListing.id)}
                                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-purple-500"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {otherListing.service_types && otherListing.service_types.length > 0 ? (
                                                    otherListing.service_types.slice(0, 2).map((st, idx) => (
                                                        <span key={idx} className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-semibold capitalize">
                                                            {st?.service_type?.replace('_', ' ') || 'Service'}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-semibold capitalize">
                                                        Service
                                                    </span>
                                                )}
                                            </div>
                                            {otherListing.monthly_rate && (
                                                <span className="text-lg font-bold text-green-600">
                                                    PKR {otherListing.monthly_rate}/month
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2 capitalize">
                                            {otherListing.work_type?.replace('_', ' ') || 'Service'} • {otherListing.locations && otherListing.locations.length > 0 ? `${otherListing.locations[0].city}, ${otherListing.locations[0].area}` : 'Location not specified'}
                                        </p>
                                        {otherListing.description && (
                                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                                {otherListing.description}
                                            </p>
                                        )}
                                        <span className="text-purple-600 font-semibold text-sm">View Details →</span>
                                    </Link>
                                ))}
                            </div>
                            <div className="mt-6 text-center">
                                {listing.user?.role === 'helper' && listing.user?.id && (
                                    <Link
                                        to={route('helpers.show', listing.user.id)}
                                        className="text-purple-600 hover:text-purple-800 font-semibold"
                                    >
                                        View All Services from {listing.user?.name} →
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}

