import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { route } from '@/utils/routes';
import axios from 'axios';
import { serviceListingsService } from '@/services/serviceListings';

export default function ServiceListingsIndex() {
    const [listings, setListings] = useState({ data: [], links: [], meta: {} });
    const [filters, setFilters] = useState({});
    const [loading, setLoading] = useState(true);
    const [serviceType, setServiceType] = useState('');
    const [workType, setWorkType] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [locationId, setLocationId] = useState('');
    const [locationDisplay, setLocationDisplay] = useState('');
    const [locationFilterQuery, setLocationFilterQuery] = useState('');
    const [locationFilterSuggestions, setLocationFilterSuggestions] = useState([]);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
    const locationFilterRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    const serviceTypes = [
        { value: '', label: 'All Services' },
        { value: 'maid', label: 'Maid' },
        { value: 'cook', label: 'Cook' },
        { value: 'babysitter', label: 'Babysitter' },
        { value: 'caregiver', label: 'Caregiver' },
        { value: 'cleaner', label: 'Cleaner' },
        { value: 'all_rounder', label: 'All Rounder' },
    ];

    // Fetch location suggestions for filter
    useEffect(() => {
        if (locationFilterQuery.length >= 2) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                axios
                    .get('/api/locations/search', {
                        params: { q: locationFilterQuery },
                    })
                    .then((response) => {
                        setLocationFilterSuggestions(response.data);
                        setShowLocationSuggestions(true);
                    })
                    .catch((error) => {
                        console.error('Error fetching locations:', error);
                        setLocationFilterSuggestions([]);
                    });
            }, 300);
        } else {
            setLocationFilterSuggestions([]);
            setShowLocationSuggestions(false);
        }
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [locationFilterQuery]);

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (locationFilterRef.current && !locationFilterRef.current.contains(event.target)) {
                setShowLocationSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLocationSelect = (location) => {
        setLocationId(location.id || '');
        setLocationDisplay(location.display_text);
        setLocationFilterQuery(location.display_text);
        setShowLocationSuggestions(false);
    };

    // Fetch listings from API
    useEffect(() => {
        const params = {
            service_type: serviceType || undefined,
            work_type: workType || undefined,
            location_id: locationId || undefined,
            sort_by: sortBy,
        };
        
        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        
        setLoading(true);
        serviceListingsService.getListings(params)
            .then((data) => {
                setListings(data.listings || { data: [], links: [], meta: {} });
                setFilters(data.filters || {});
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching listings:', error);
                setLoading(false);
            });
    }, [serviceType, workType, locationId, sortBy]);

    const handleFilter = () => {
        // Filters are applied via useEffect above
    };

    return (
        <PublicLayout>
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-orange-500 text-white py-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse Services Offered</h1>
                    <p className="text-xl text-white/90">Find services offered by verified helpers and businesses</p>
                </div>
            </div>

            {/* Notice */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
                    <p className="text-sm text-yellow-700">
                        <strong>Note:</strong> We are currently serving Karachi only. We will be going live in different cities soon!
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Filter Services</h2>
                    <div className="grid md:grid-cols-5 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Service Type</label>
                            <select
                                value={serviceType}
                                onChange={(e) => setServiceType(e.target.value)}
                                className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 py-3 px-4 shadow-sm"
                            >
                                {serviceTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Work Type</label>
                            <select
                                value={workType}
                                onChange={(e) => setWorkType(e.target.value)}
                                className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 py-3 px-4 shadow-sm"
                            >
                                <option value="">All Types</option>
                                <option value="full_time">Full Time</option>
                                <option value="part_time">Part Time</option>
                            </select>
                        </div>
                        <div className="relative" ref={locationFilterRef}>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Location</label>
                            <input
                                type="text"
                                value={locationFilterQuery || locationDisplay}
                                onChange={(e) => {
                                    setLocationFilterQuery(e.target.value);
                                    if (!e.target.value) {
                                        setLocationId('');
                                        setLocationDisplay('');
                                    }
                                }}
                                onFocus={() => {
                                    if (locationFilterSuggestions.length > 0) {
                                        setShowLocationSuggestions(true);
                                    }
                                }}
                                className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 py-3 px-4 shadow-sm"
                                placeholder="Search location..."
                            />
                            {showLocationSuggestions && locationFilterSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    {locationFilterSuggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleLocationSelect(suggestion)}
                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            {suggestion.display_text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 py-3 px-4 shadow-sm"
                            >
                                <option value="created_at">Newest</option>
                                <option value="rate_low">Rate: Low to High</option>
                                <option value="rate_high">Rate: High to Low</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleFilter}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Listings Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Loading service listings...</p>
                    </div>
                ) : listings.data && listings.data.length > 0 ? (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {listings.data.map((listing) => (
                                <div
                                    key={listing.id}
                                    className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                                >
                                    <Link
                                        to={route('service-listings.show', listing.id)}
                                        className="block"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {listing.service_types && listing.service_types.length > 0 ? (
                                                        listing.service_types.slice(0, 2).map((st, idx) => (
                                                            <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-semibold capitalize">
                                                                {/*{st?.service_type?.replace('_', ' ') || 'Service'}*/}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-semibold capitalize">
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
                                            <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {listing.user?.name || 'Helper'}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-3 capitalize">
                                                {listing.work_type?.replace('_', ' ') || 'Service'} • {listing.locations && listing.locations.length > 0 ? `${listing.locations[0].city}, ${listing.locations[0].area}` : 'Location not specified'}
                                            </p>
                                            {listing.description && (
                                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                    {listing.description}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs text-gray-500 capitalize">
                                                    {listing.work_type?.replace('_', ' ') || 'Available'}
                                                </span>
                                                <span className="text-blue-600 font-semibold text-sm">View Details →</span>
                                            </div>
                                        </div>
                                    </Link>
                                    {listing.user?.phone && (
                                        <div className="px-6 pb-6 pt-0">
                                            <a
                                                to={`tel:${listing.user.phone}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg font-semibold text-sm inline-flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                Contact Provider
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {listings.links && listings.links.length > 1 && (
                            <div className="mt-12">
                                {/* Results Info */}
                                {listings.total !== undefined && (
                                    <div className="text-center mb-6 text-gray-600">
                                        <p className="text-sm">
                                            Showing {listings.from || 0} to {listings.to || 0} of {listings.total || 0} results
                                        </p>
                                    </div>
                                )}
                                <div className="flex justify-center">
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {listings.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                to={link.url || '#'}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                                    link.active
                                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                                                } ${!link.url && 'cursor-not-allowed opacity-50'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-xl">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-gray-600 text-xl mb-6">No services found</p>
                        <p className="text-gray-500 mb-8">Try adjusting your filters</p>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}

