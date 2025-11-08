import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import { homeService } from "@/services/home";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";

export default function Home() {
    const { user } = useAuth();
    const [featuredHelpers, setFeaturedHelpers] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch home data from API
        homeService.getHomeData()
            .then((data) => {
                setFeaturedHelpers(data.featured_helpers || []);
                setStats(data.stats || {});
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching home data:", error);
                setLoading(false);
            });
    }, []);
    const services = [
        { name: "Maid", icon: "🧹", color: "from-blue-500 to-blue-600" },
        { name: "Cook", icon: "👨‍🍳", color: "from-orange-500 to-orange-600" },
        { name: "Babysitter", icon: "👶", color: "from-pink-500 to-pink-600" },
        { name: "Caregiver", icon: "👵", color: "from-green-500 to-green-600" },
        { name: "Cleaner", icon: "✨", color: "from-blue-500 to-blue-600" },
        { name: "All Rounder", icon: "🌟", color: "from-yellow-500 to-yellow-600" },
    ];

    const steps = [
        {
            number: "1",
            title: "Book",
            description: "Choose your service and preferred helper",
            icon: "📅",
        },
        {
            number: "2",
            title: "Verify",
            description: "We verify all helpers with background checks",
            icon: "✅",
        },
        {
            number: "3",
            title: "Relax",
            description: "Sit back and enjoy quality home care",
            icon: "😌",
        },
    ];

    const testimonials = [
        {
            name: "Priya Sharma",
            service: "Maid",
            rating: 5,
            comment: "Excellent service! Found a reliable maid within minutes.",
        },
        {
            name: "Raj Kumar",
            service: "Cook",
            rating: 5,
            comment: "Best cook we ever had. Highly recommended!",
        },
        {
            name: "Anjali Mehta",
            service: "Babysitter",
            rating: 5,
            comment: "Trustworthy and professional. My kids love her!",
        },
    ];

    return (
        <PublicLayout>

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-orange-500 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                            Hire Trusted Home Help in Minutes
                        </h1>
                        <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed">
                            Connect with verified domestic helpers - maids, cooks, babysitters, and more. Your trusted partner for quality home care.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            {user?.role !== "helper" && (
                                <Link
                                    to={route("helpers.index")}
                                    className="bg-white text-blue-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 min-w-[200px] text-center"
                                >
                                    Browse Helpers
                                </Link>
                            )}
                            <Link
                                to={route("service-requests.browse")}
                                className="bg-white text-blue-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 min-w-[200px] text-center"
                            >
                                Services Required
                            </Link>
                            {user?.role !== "helper" && (
                                <Link
                                    to={route("bookings.create")}
                                    className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 min-w-[200px] text-center"
                                >
                                    Post Request
                                </Link>
                            )}
                            {user && (user.role === "helper" || user.role === "business") && (
                                <Link
                                    to={route("service-listings.create")}
                                    className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 min-w-[200px] text-center"
                                >
                                    Offer Service
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                            <div className="text-5xl font-bold text-blue-600 mb-3">{stats?.total_helpers || 0}+</div>
                            <div className="text-gray-700 font-medium">Verified Helpers</div>
                        </div>
                        <div className="text-center p-8 bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                            <div className="text-5xl font-bold text-blue-600 mb-3">{stats?.total_bookings || 0}+</div>
                            <div className="text-gray-700 font-medium">Bookings</div>
                        </div>
                        <div className="text-center p-8 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                            <div className="text-5xl font-bold text-orange-600 mb-3">{stats?.total_reviews || 0}+</div>
                            <div className="text-gray-700 font-medium">Reviews</div>
                        </div>
                        <div className="text-center p-8 bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                            <div className="text-5xl font-bold text-green-600 mb-3">{stats?.verified_helpers || 0}+</div>
                            <div className="text-gray-700 font-medium">Police Verified</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Our Services</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Choose from a wide range of professional home help services tailored to your needs
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {services.map((service) => (
                            <Link
                                key={service.name}
                                to={route("helpers.index") + `?service_type=${service.name.toLowerCase().replace(" ", "_")}`}
                                className="group bg-white p-8 rounded-2xl text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-blue-200"
                            >
                                <div className={"text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-300"}>{service.icon}</div>
                                <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{service.name}</h3>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">How It Works</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Get started in three simple steps
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {steps.map((step, index) => (
                            <div key={index} className="text-center relative">
                                <div className="bg-gradient-to-br w-24 h-24 flex items-center justify-center mx-auto mb-6 text-white text-5xl transform hover:scale-110 transition-transform">
                                    {step.icon}
                                </div>
                                <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-2xl shadow-lg">
                                    {step.number}
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-gray-900">{step.title}</h3>
                                <p className="text-gray-600 text-lg leading-relaxed">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Indicators */}
            <section className="py-24 bg-gradient-to-br from-blue-50 via-blue-100 to-orange-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Why Choose Us?</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="text-center p-10 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="text-6xl mb-6">🔒</div>
                            <h3 className="font-bold text-xl mb-4 text-gray-900">Police Verified</h3>
                            <p className="text-gray-600 leading-relaxed">All helpers undergo thorough background verification and police checks</p>
                        </div>
                        <div className="text-center p-10 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="text-6xl mb-6">✨</div>
                            <h3 className="font-bold text-xl mb-4 text-gray-900">Free Replacement</h3>
                            <p className="text-gray-600 leading-relaxed">Not satisfied? Get a free replacement guarantee within 7 days</p>
                        </div>
                        <div className="text-center p-10 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="text-6xl mb-6">⭐</div>
                            <h3 className="font-bold text-xl mb-4 text-gray-900">1000+ Verified</h3>
                            <p className="text-gray-600 leading-relaxed">Large pool of trusted and experienced helpers ready to serve</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Helpers */}
            {!loading && featuredHelpers && featuredHelpers.length > 0 && (
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Featured Helpers</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Top-rated professionals ready to serve you
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {featuredHelpers && featuredHelpers.length > 0 ? featuredHelpers.map((helper) => {
                                // Ensure helper.id exists before creating route
                                if (!helper.id) {
                                    console.warn("Helper missing id:", helper);
                                    return null;
                                }
                                return (
                                    <Link
                                        key={helper.id}
                                        to={route("helpers.show", helper.id)}
                                        className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                                    >
                                        <div className="h-64 bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center overflow-hidden">
                                            {helper.photo ? (
                                                <img src={`/storage/${helper.photo}`} alt={helper.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                            ) : (
                                                <div className="text-8xl text-white">👤</div>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-2xl font-bold mb-2 text-gray-900">{helper.name}</h3>
                                            <p className="text-gray-600 mb-3 capitalize">
                                                {helper.service_listings && helper.service_listings.length > 0 && helper.service_listings[0].service_types && helper.service_listings[0].service_types.length > 0
                                                    ? helper.service_listings?.[0]?.service_types?.[0]?.service_type?.replace("_", " ") || "Helper"
                                                    : "Helper"}
                                            </p>
                                            <div className="flex items-center mb-3">
                                                <span className="text-yellow-500 text-2xl mr-2">⭐</span>
                                                <span className="font-semibold text-lg">{helper.rating || 0}</span>
                                                <span className="text-gray-500 ml-2">({helper.total_reviews || 0} reviews)</span>
                                            </div>
                                            <p className="text-sm text-gray-500">{helper.city || "N/A"}, {helper.area || "N/A"}</p>
                                        </div>
                                    </Link>
                                );
                            }) : (
                                <div className="col-span-3 text-center py-12">
                                    <p className="text-gray-600">No featured helpers available at the moment.</p>
                                </div>
                            )}
                        </div>
                        <div className="text-center mt-12">
                            <Link
                                to={route("helpers.index")}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl inline-block"
                            >
                                View All Helpers
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">What Our Customers Say</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow">
                                <div className="flex mb-6">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <span key={i} className="text-yellow-500 text-2xl">⭐</span>
                                    ))}
                                </div>
                                <p className="text-gray-700 mb-6 italic text-lg leading-relaxed">"{testimonial.comment}"</p>
                                <div className="font-semibold text-gray-900 text-lg">{testimonial.name}</div>
                                <div className="text-sm text-gray-500">{testimonial.service}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-r from-blue-600 via-blue-700 to-orange-500 text-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Find Your Perfect Helper?</h2>
                    <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto">
                        Join thousands of happy customers who found their trusted home help
                    </p>
                    {!user && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to={route("register")}
                                className="bg-white text-blue-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 min-w-[200px]"
                            >
                                Get Started
                            </Link>
                            <Link
                                to={route("helpers.index")}
                                className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 min-w-[200px]"
                            >
                                Browse Helpers
                            </Link>
                            <Link
                                to={route("service-requests.browse")}
                                className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 min-w-[200px]"
                            >
                                Services Required
                            </Link>
                        </div>
                    )}
                    {user && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            {(user.role === "helper" || user.role === "business") && (
                                <Link
                                    to={route("service-listings.create")}
                                    className="bg-white text-blue-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 min-w-[200px]"
                                >
                                    Offer Your Service
                                </Link>
                            )}
                            {user.role !== "helper" && (
                                <Link
                                    to={route("bookings.create")}
                                    className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 min-w-[200px]"
                                >
                                    Post Service Request
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </PublicLayout>
    );
}
