import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { businessesService } from '@/services/businesses';
import { useAuth } from '@/contexts/AuthContext';
import { route } from '@/utils/routes';

export default function BusinessDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentWorkers, setRecentWorkers] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        businessesService.getDashboard()
            .then((response) => {
                setStats(response.stats);
                setRecentWorkers(response.recent_workers || []);
                setRecentBookings(response.recent_bookings || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching dashboard:', err);
                setError(err.response?.data?.message || 'Failed to load dashboard');
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <PublicLayout>
                
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 text-center">
                        <p className="text-gray-600">Loading dashboard...</p>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    if (error) {
        return (
            <PublicLayout>
                
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 text-center">
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
            </PublicLayout>
        );
    }
    return (
        <PublicLayout>
            

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Business Dashboard</h2>
                        <p className="mt-2 text-gray-600">Manage your agency workers and bookings</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-blue-600 mb-2">{stats?.total_workers || 0}</div>
                            <div className="text-gray-600">Total Workers</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-green-600 mb-2">{stats?.active_workers || 0}</div>
                            <div className="text-gray-600">Active Workers</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-yellow-600 mb-2">{stats?.pending_verification || 0}</div>
                            <div className="text-gray-600">Pending</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-blue-600 mb-2">{stats?.verified_workers || 0}</div>
                            <div className="text-gray-600">Verified</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-blue-600 mb-2">{stats?.total_bookings || 0}</div>
                            <div className="text-gray-600">Bookings</div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Recent Workers */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Recent Workers</h3>
                                <Link
                                    to={route('business.workers')}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    View All
                                </Link>
                            </div>
                            {recentWorkers && recentWorkers.length > 0 ? (
                                <div className="space-y-4">
                                    {recentWorkers.map((worker) => (
                                        <div key={worker.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <div className="font-medium">{worker.user?.name}</div>
                                                <div className="text-sm text-gray-600 capitalize">
                                                    {worker.service_listings && worker.service_listings.length > 0 && worker.service_listings[0].service_types && worker.service_listings[0].service_types.length > 0
                                                        ? worker.service_listings?.[0]?.service_types?.[0]?.service_type?.replace('_', ' ') || 'No service type'
                                                        : 'No service type'}
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {worker.verification_status === 'verified' ? (
                                                    <span className="text-green-600">✓ Verified</span>
                                                ) : (
                                                    <span className="text-yellow-600">Pending</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No workers yet</p>
                                    <Link
                                        to={route('business.workers.create')}
                                        className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Add Your First Worker
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Recent Bookings */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Recent Bookings</h3>
                                <Link
                                    to={route('bookings.index')}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    View All
                                </Link>
                            </div>
                            {recentBookings && recentBookings.length > 0 ? (
                                <div className="space-y-4">
                                    {recentBookings.map((booking) => (
                                        <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <div className="font-medium">{booking.user?.name}</div>
                                                <div className="text-sm text-gray-600 capitalize">{booking.service_type?.replace('_', ' ') || 'N/A'}</div>
                                            </div>
                                            <div className="text-sm text-gray-500 capitalize">{booking.status}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No bookings yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8">
                        <Link
                            to={route('business.workers.create')}
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition duration-300 shadow-lg"
                        >
                            ➕ Add New Worker
                        </Link>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

