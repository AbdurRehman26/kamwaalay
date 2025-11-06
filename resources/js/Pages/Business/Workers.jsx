// Head removed
import { useState, useEffect } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { businessesService } from '@/services/businesses';

export default function Workers() {
    const [workers, setWorkers] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        businessesService.getWorkers()
            .then((response) => {
                setWorkers(response.workers || { data: [], links: [] });
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching workers:', err);
                setError(err.response?.data?.message || 'Failed to load workers');
                setLoading(false);
            });
    }, []);

    const handleDelete = async (workerId) => {
        if (confirm('Are you sure you want to remove this worker?')) {
            try {
                await businessesService.deleteWorker(workerId);
                // Refresh workers list
                const response = await businessesService.getWorkers();
                setWorkers(response.workers || { data: [], links: [] });
            } catch (err) {
                console.error('Error deleting worker:', err);
                alert(err.response?.data?.message || 'Failed to delete worker');
            }
        }
    };

    if (loading) {
        return (
            <PublicLayout>
                
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 text-center">
                        <p className="text-gray-600">Loading workers...</p>
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
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Manage Workers</h2>
                            <p className="mt-2 text-gray-600">Add and manage workers in your agency</p>
                        </div>
                        <Link
                            to={route('business.workers.create')}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg font-semibold"
                        >
                            ➕ Add Worker
                        </Link>
                    </div>

                    {workers.data && workers.data.length > 0 ? (
                        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                {workers.data.map((worker) => (
                                    <div key={worker.id} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-20 w-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center overflow-hidden">
                                                {worker.photo ? (
                                                    <img src={`/storage/${worker.photo}`} alt={worker.user?.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-4xl text-white">👤</div>
                                                )}
                                            </div>
                                            {worker.verification_status === 'verified' && (
                                                <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">✓ Verified</span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">{worker.user?.name}</h3>
                                        <p className="text-gray-600 mb-2 capitalize">
                                            {worker.service_listings && worker.service_listings.length > 0 && worker.service_listings[0].service_types && worker.service_listings[0].service_types.length > 0
                                                ? worker.service_listings?.[0]?.service_types?.[0]?.service_type?.replace('_', ' ') || 'No service type'
                                                : 'No service type'}
                                        </p>
                                        <div className="flex items-center mb-2">
                                            <span className="text-yellow-500 mr-2">⭐</span>
                                            <span className="font-semibold">{worker.rating || 0}</span>
                                            <span className="text-gray-500 ml-2 text-sm">({worker.total_reviews || 0} reviews)</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-4">{worker.city}, {worker.area}</p>
                                        <div className="flex gap-2">
                                            <Link
                                                to={route('business.workers.edit', worker.id)}
                                                className="flex-1 text-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(worker.id)}
                                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {workers.links && workers.links.length > 3 && (
                                <div className="px-6 py-4 border-t border-gray-200">
                                    <div className="flex justify-center space-x-2">
                                        {workers.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                to={link.url || '#'}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                                    link.active
                                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                                                } ${!link.url && 'cursor-not-allowed opacity-50'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <div className="text-6xl mb-4">👥</div>
                            <h3 className="text-xl font-semibold mb-2 text-gray-900">No Workers Yet</h3>
                            <p className="text-gray-600 mb-6">Start building your agency by adding your first worker</p>
                            <Link
                                to={route('business.workers.create')}
                                className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg font-semibold"
                            >
                                Add Your First Worker
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}

