import { Link, useParams, useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import { useEffect, useState } from "react";
import { helpersService } from "@/services/helpers";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import ChatPopup from "@/Components/ChatPopup";

export default function HelperShow() {
    const { helperId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [helper, setHelper] = useState(null);
    const [loading, setLoading] = useState(true);

    const serviceListings = helper?.service_listings || [];
    const reviews = helper?.helper_reviews || [];
    const [chatOpen, setChatOpen] = useState(false);

    // Format phone number for WhatsApp (add +92 if needed)
    const formatPhoneForWhatsApp = (phone) => {
        if (!phone) return "";

        // Check if it starts with +92 (with or without spaces)
        const trimmed = phone.trim();
        if (trimmed.startsWith("+92") || trimmed.startsWith("+ 92")) {
            // Remove all non-digit characters, which will keep 92 at the start
            return trimmed.replace(/\D/g, "");
        }

        // Remove all non-digit characters
        let cleaned = phone.replace(/\D/g, "");

        // If starts with 0, replace with 92
        if (cleaned.startsWith("0")) {
            cleaned = "92" + cleaned.substring(1);
        }
        // If doesn't start with 92, add it
        else if (!cleaned.startsWith("92")) {
            cleaned = "92" + cleaned;
        }

        return cleaned;
    };

    useEffect(() => {
        if (helperId) {
            helpersService.getHelper(helperId)
                .then((data) => {
                    setHelper(data.helper);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching helper:", error);
                    setLoading(false);
                });
        }
    }, [helperId]);

    if (loading) {
        return (
            <PublicLayout>

                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-gray-600 dark:text-gray-400">Loading helper profile...</p>
                </div>
            </PublicLayout>
        );
    }

    if (!helper) {
        return (
            <PublicLayout>

                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-gray-600 dark:text-gray-400">Helper not found.</p>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>


            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-800 dark:to-primary-900 text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-shrink-0">
                            {helper.photo ? (
                                <img
                                    src={`/storage/${helper.photo}`}
                                    alt={helper.name}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-300 shadow-lg"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-white/20 dark:bg-gray-800/30 flex items-center justify-center text-6xl border-4 border-white dark:border-gray-300 shadow-lg">
                                    👤
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold mb-2">{helper.name}</h1>
                            <p className="text-xl text-white/90 mb-4">{helper.bio || "Professional helper"}</p>
                            <div className="flex items-center gap-4">
                                {/* Rating - Hidden */}
                                {false && (
                                    <div className="flex items-center">
                                        <span className="text-yellow-300 text-2xl mr-2">⭐</span>
                                        <span className="text-2xl font-bold">{helper.rating || 0}</span>
                                        <span className="text-white/80 ml-2">({helper.total_reviews || 0} reviews)</span>
                                    </div>
                                )}
                                {helper.verification_status === "verified" && (
                                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        ✓ Verified
                                    </span>
                                )}
                            </div>
                            {/* Skills Display */}
                            {helper.skills && (
                                <div className="mt-4">
                                    <p className="text-sm text-white/80 mb-2">Skills:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {helper.skills.split(",").map((skill, idx) => (
                                            <span key={idx} className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                                                {skill.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Primary Service Types from Listings */}
                            {helper.service_listings && helper.service_listings.length > 0 && helper.service_listings[0].service_types && helper.service_listings[0].service_types.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm text-white/80 mb-2">Services Offered:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {helper.service_listings[0].service_types.slice(0, 3).map((serviceType, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1 bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                                                {typeof serviceType === "object" && serviceType.icon && <span>{serviceType.icon}</span>}
                                                <span className="capitalize">
                                                    {typeof serviceType === "object" && serviceType.name ? serviceType.name : (typeof serviceType === "string" ? serviceType.replace("_", " ") : (serviceType?.service_type?.replace("_", " ") || "Service"))}
                                                </span>
                                            </span>
                                        ))}
                                        {helper.service_listings[0].service_types.length > 3 && (
                                            <span className="relative group cursor-pointer bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                                                +{helper.service_listings[0].service_types.length - 3} more
                                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                                    <p className="text-gray-900 dark:text-white font-bold mb-2 text-xs border-b border-gray-100 dark:border-gray-700 pb-1">All Services</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {helper.service_listings[0].service_types.map((type, i) => (
                                                            <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded capitalize">
                                                                {typeof type === "object" && type.name ? type.name : (typeof type === "string" ? type.replace("_", " ") : (type?.service_type?.replace("_", " ") || "Service"))}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="hidden md:block">
                            <a
                                href="https://play.google.com/store/apps/details?id=com.kamwaalay.app"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <img
                                    src="/images/google-play-download-android-app-logo.webp"
                                    alt="Get it on Google Play"
                                    className="h-24 w-auto hover:opacity-90 transition-opacity cursor-pointer"
                                />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Service Listings */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Services Offered</h2>
                            {serviceListings && serviceListings.length > 0 ? (
                                <>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {serviceListings.map((listing) => (
                                            <div
                                                key={listing.id}
                                                className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-lg p-6 border-2 border-transparent"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {listing.service_types && listing.service_types.length > 0 ? (
                                                            <>
                                                                {listing.service_types.slice(0, 2).map((serviceType, idx) => (
                                                                    <span key={idx} className="inline-flex items-center gap-1 bg-primary-600 text-white text-sm px-3 py-1 rounded-full font-semibold">
                                                                        {typeof serviceType === "object" && serviceType.icon && <span>{serviceType.icon}</span>}
                                                                        <span className="capitalize">
                                                                            {typeof serviceType === "object" && serviceType.name ? serviceType.name : (typeof serviceType === "string" ? serviceType.replace("_", " ") : (serviceType?.service_type?.replace("_", " ") || "Service"))}
                                                                        </span>
                                                                    </span>
                                                                ))}
                                                                {listing.service_types.length > 2 && (
                                                                    <span className="relative group cursor-pointer bg-primary-500 text-white text-sm px-3 py-1 rounded-full font-semibold">
                                                                        +{listing.service_types.length - 2}
                                                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {listing.service_types.map((type, i) => (
                                                                                    <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded capitalize whitespace-nowrap">
                                                                                        {typeof type === "object" && type.name ? type.name : (typeof type === "string" ? type.replace("_", " ") : (type?.service_type?.replace("_", " ") || "Service"))}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="bg-primary-600 text-white text-sm px-3 py-1 rounded-full font-semibold capitalize">
                                                                Service
                                                            </span>
                                                        )}
                                                    </div>
                                                    {listing.monthly_rate && (
                                                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                                            PKR {listing.monthly_rate}/month
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Work Type */}
                                                <div className="mb-3">
                                                    <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-3 py-1 rounded-full font-medium capitalize">
                                                        {listing.work_type?.replace("_", " ") || "Service"}
                                                    </span>
                                                </div>

                                                {/* Locations */}
                                                {listing.location_details && listing.location_details.length > 0 ? (
                                                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-3 space-y-1">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Locations:</p>
                                                        {listing.location_details.slice(0, 2).map((location, idx) => (
                                                            <p key={idx} className="flex items-center">
                                                                <span className="mr-2">📍</span>
                                                                <span>{location.city_name}{location.area ? ", " + location.area : ""}</span>
                                                            </p>
                                                        ))}
                                                        {listing.location_details.length > 2 && (
                                                            <p className="text-gray-500 dark:text-gray-400 font-medium text-xs mt-1">
                                                                +{listing.location_details.length - 2} more location{listing.location_details.length - 2 !== 1 ? "s" : ""}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : listing.area ? (
                                                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                                        <p className="flex items-center">
                                                            <span className="mr-2">📍</span>
                                                            <span>{listing.area}</span>
                                                        </p>
                                                    </div>
                                                ) : null}

                                                {/* Description */}
                                                {listing.description && (
                                                    <div className="mb-3">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Description:</p>
                                                        <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                                                            {listing.description}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Status Badge */}
                                                {listing.status && (
                                                    <div className="mb-3">
                                                        <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${listing.status === "active"
                                                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                                            }`}>
                                                            {listing.status === "active" ? "✓ Active" : listing.status}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {serviceListings.length > 1 && (
                                        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                                            {helper.name} offers {serviceListings.length} different service{serviceListings.length !== 1 ? "s" : ""} across multiple locations
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                                    <p className="text-gray-500 dark:text-gray-400">No services added yet.</p>
                                </div>
                            )}
                        </div>


                        {/* Reviews Section - Hidden */}
                        {false && reviews && reviews.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Reviews & Ratings</h2>
                                <div className="space-y-6">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-primary-200 dark:bg-primary-900/30 flex items-center justify-center mr-3 text-primary-800 dark:text-primary-300">
                                                        {review.user?.name?.charAt(0) || "U"}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{review.user?.name || "Anonymous"}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex text-yellow-400">
                                                    {[...Array(5)].map((_, i) => (
                                                        <svg key={i} className={`w-5 h-5 ${i < review.rating ? "fill-current" : "text-gray-300 dark:text-gray-600"}`} viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.565-1.839-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                            </div>
                                            {review.comment && (
                                                <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
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
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Profile Information</h3>
                            <div className="space-y-4">
                                {helper.experience_years && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Experience</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{helper.experience_years} years</p>
                                    </div>
                                )}
                                {helper.skills && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {helper.skills.split(",").map((skill, idx) => (
                                                <span key={idx} className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-2 py-1 rounded text-xs font-medium">
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {helper.gender && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Gender</p>
                                        <p className="font-semibold text-gray-900 dark:text-white capitalize">{helper.gender}</p>
                                    </div>
                                )}
                                {helper.religion && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Religion</p>
                                        <p className="font-semibold text-gray-900 dark:text-white capitalize">
                                            {typeof helper.religion === "object"
                                                ? helper.religion.label
                                                : helper.religion.replace(/_/g, " ")}
                                        </p>
                                    </div>
                                )}
                                {helper.languages && helper.languages.length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Languages</p>
                                        <div className="flex flex-wrap gap-2">
                                            {helper.languages.map((lang, idx) => (
                                                <span key={idx} className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-2 py-1 rounded text-xs font-medium">
                                                    {lang.name || lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {(helper.address || helper.city) && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {helper.address ||
                                                `${typeof helper.city === "object" ? helper.city?.name : helper.city}, ${helper.area || "N/A"}`
                                            }
                                        </p>
                                    </div>
                                )}
                                {helper.availability && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Availability</p>
                                        <p className="font-semibold text-gray-900 dark:text-white capitalize">{helper.availability.replace("_", " ")}</p>
                                    </div>
                                )}
                                {helper.created_at && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{new Date(helper.created_at).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {helper.phone && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{helper.phone}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contact Options */}
                        {helper.phone && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Contact Helper</h3>
                                <div className="flex items-center justify-center gap-4">
                                    {/* In-app Message Icon */}
                                    {user ? (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setChatOpen(true);
                                            }}
                                            className="flex items-center justify-center w-14 h-14 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                            title="Send Message"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigate(route("login"));
                                            }}
                                            className="flex items-center justify-center w-14 h-14 bg-gray-400 dark:bg-gray-600 text-white rounded-full cursor-not-allowed opacity-60 hover:bg-gray-500 dark:hover:bg-gray-700 transition-all duration-300 shadow-md"
                                            title="Please login to send message"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Call Icon */}
                                    <a
                                        href={`tel:${helper.phone}`}
                                        className="flex items-center justify-center w-14 h-14 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                        title="Call"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </a>

                                    {/* WhatsApp Icon */}
                                    <a
                                        href={`https://wa.me/${formatPhoneForWhatsApp(helper.phone)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full hover:bg-[#20BA5A] transition-all duration-300 shadow-md hover:shadow-lg"
                                        title="WhatsApp"
                                    >
                                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Popup */}
            {helper && (
                <ChatPopup
                    recipientId={helper.id}
                    recipientName={helper.name}
                    recipientPhoto={helper.photo}
                    isOpen={chatOpen}
                    onClose={() => setChatOpen(false)}
                />
            )}
        </PublicLayout>
    );
}


