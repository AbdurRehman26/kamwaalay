import DashboardLayout from "@/Layouts/DashboardLayout";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profile";
import UploadDocumentModal from "./UploadDocumentModal";

export default function DashboardDocuments() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Fetch documents for helpers/businesses
    useEffect(() => {
        if (user && (user.role === "helper" || user.role === "business")) {
            setLoadingDocuments(true);
            profileService.getDocuments()
                .then((data) => {
                    setDocuments(data.documents || []);
                    setLoadingDocuments(false);
                })
                .catch((error) => {
                    console.error("Error fetching documents:", error);
                    setLoadingDocuments(false);
                });
        }
    }, [user]);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-10 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">Documents</h1>
                            <p className="text-indigo-100 text-lg max-w-2xl">
                                Manage your verification documents and track approval status.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center justify-center px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all duration-300 shadow-lg group whitespace-nowrap"
                        >
                            <span className="mr-2 text-xl group-hover:rotate-90 transition-transform">➕</span>
                            Upload Document
                        </button>
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-20 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl transform translate-y-1/2"></div>
                </div>

                {/* Verification Status */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Onboarding Status */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Onboarding Status</h3>
                            {user?.onboarding_complete ? (
                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                                    <span className="text-xl text-white">✓</span>
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                                    <span className="text-xl text-white">⏳</span>
                                </div>
                            )}
                        </div>
                        {user?.onboarding_complete ? (
                            <div>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">Completed</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Your profile is complete and ready</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mb-1">In Progress</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Complete your onboarding to get started</p>
                            </div>
                        )}
                    </div>

                    {/* Verification Status */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Verification Status</h3>
                            {user?.verification_status === "verified" ? (
                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                                    <span className="text-xl text-white">✓</span>
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                                    <span className="text-xl text-white">⏳</span>
                                </div>
                            )}
                        </div>
                        {user?.verification_status === "verified" ? (
                            <div>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">Verified</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Your documents are verified</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mb-1">Pending</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Awaiting document verification</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Documents Section */}
                {loadingDocuments ? (
                    <div className="flex justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-gray-500 animate-pulse">Loading documents...</p>
                        </div>
                    </div>
                ) : documents.length > 0 ? (
                    <div className="space-y-6">
                        {documents.map((document) => {
                            const filePath = document.file_path ? `/storage/${document.file_path}` : null;
                            const isImage = filePath && /\.(jpg|jpeg|png|gif|webp)$/i.test(filePath);
                            const isPdf = filePath && /\.pdf$/i.test(filePath);

                            return (
                                <div key={document.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-300">
                                    <div className="flex gap-4">
                                        {/* Image Preview */}
                                        {filePath && (
                                            <div className="flex-shrink-0">
                                                {isImage ? (
                                                    <a
                                                        href={filePath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block relative"
                                                    >
                                                        <img
                                                            src={filePath}
                                                            alt={document.document_type_label || document.document_type}
                                                            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer"
                                                            onError={(e) => {
                                                                // Fallback if image fails to load
                                                                e.target.style.display = "none";
                                                                const fallback = e.target.parentElement.querySelector(".image-fallback");
                                                                if (fallback) fallback.style.display = "flex";
                                                            }}
                                                        />
                                                        <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center image-fallback hidden absolute top-0 left-0">
                                                            <span className="text-4xl">📄</span>
                                                        </div>
                                                    </a>
                                                ) : isPdf ? (
                                                    <a
                                                        href={filePath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block"
                                                    >
                                                        <div className="w-32 h-32 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 transition-colors flex flex-col items-center justify-center cursor-pointer">
                                                            <span className="text-5xl mb-2">📕</span>
                                                            <span className="text-xs text-red-700 dark:text-red-400 font-semibold">PDF</span>
                                                        </div>
                                                    </a>
                                                ) : (
                                                    <a
                                                        href={filePath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block"
                                                    >
                                                        <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors flex items-center justify-center cursor-pointer">
                                                            <span className="text-4xl">📄</span>
                                                        </div>
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {/* Document Info */}
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {document.document_type_label || document.document_type}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${document.status === "verified"
                                                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                                        : document.status === "rejected"
                                                            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                                                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                                                    }`}>
                                                    {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                                                </span>
                                            </div>
                                            {document.document_number && (
                                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                                    <span className="font-semibold">Number:</span> {document.document_number}
                                                </p>
                                            )}
                                            {document.admin_notes && (
                                                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-4 border-indigo-500">
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        <span className="font-semibold">Admin Note:</span> {document.admin_notes}
                                                    </p>
                                                </div>
                                            )}
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-auto">
                                                Uploaded: {new Date(document.created_at).toLocaleDateString()}
                                            </p>
                                        </div>

                                        {/* View Button */}
                                        {filePath && (
                                            <div className="flex-shrink-0 flex items-start">
                                                <a
                                                    href={filePath}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition duration-300 font-bold text-sm"
                                                >
                                                    View Full
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
                        <div className="text-7xl mb-6 opacity-80">📄</div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No documents uploaded yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                            Upload verification documents to get verified and start offering your services.
                        </p>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1"
                        >
                            <span className="mr-2 text-xl">✨</span> Upload Document
                        </button>
                    </div>
                )}
            </div>

            <UploadDocumentModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={() => {
                    // Refresh documents after successful upload
                    if (user && (user.role === "helper" || user.role === "business")) {
                        setLoadingDocuments(true);
                        profileService.getDocuments()
                            .then((data) => {
                                setDocuments(data.documents || []);
                                setLoadingDocuments(false);
                            })
                            .catch((error) => {
                                console.error("Error fetching documents:", error);
                                setLoadingDocuments(false);
                            });
                    }
                }}
            />
        </DashboardLayout>
    );
}
