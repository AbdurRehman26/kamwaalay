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
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold mb-4">Documents</h1>
                            <p className="text-xl text-white/90">Manage your verification documents</p>
                        </div>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="bg-white text-primary-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition duration-300 font-semibold"
                        >
                            + Upload Document
                        </button>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                {/* Verification Status */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Onboarding Status */}
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Onboarding Status</h3>
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
                                <p className="text-lg font-bold text-green-600 mb-1">Completed</p>
                                <p className="text-sm text-gray-600">Your profile is complete and ready</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-lg font-bold text-yellow-600 mb-1">In Progress</p>
                                <p className="text-sm text-gray-600">Complete your onboarding to get started</p>
                            </div>
                        )}
                    </div>

                    {/* Verification Status */}
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Verification Status</h3>
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
                                <p className="text-lg font-bold text-green-600 mb-1">Verified</p>
                                <p className="text-sm text-gray-600">Your documents are verified</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-lg font-bold text-yellow-600 mb-1">Pending</p>
                                <p className="text-sm text-gray-600">Awaiting document verification</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Documents Section */}
                {loadingDocuments ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Loading documents...</p>
                    </div>
                ) : documents.length > 0 ? (
                    <div className="space-y-6">
                        {documents.map((document) => {
                            const filePath = document.file_path ? `/storage/${document.file_path}` : null;
                            const isImage = filePath && /\.(jpg|jpeg|png|gif|webp)$/i.test(filePath);
                            const isPdf = filePath && /\.pdf$/i.test(filePath);
                            
                            return (
                                <div key={document.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300">
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
                                                            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200 hover:border-primary-400 transition-colors cursor-pointer"
                                                            onError={(e) => {
                                                                // Fallback if image fails to load
                                                                e.target.style.display = "none";
                                                                const fallback = e.target.parentElement.querySelector(".image-fallback");
                                                                if (fallback) fallback.style.display = "flex";
                                                            }}
                                                        />
                                                        <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center image-fallback hidden absolute top-0 left-0">
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
                                                        <div className="w-32 h-32 bg-red-50 rounded-lg border-2 border-red-200 hover:border-red-400 transition-colors flex flex-col items-center justify-center cursor-pointer">
                                                            <span className="text-5xl mb-2">📕</span>
                                                            <span className="text-xs text-red-700 font-semibold">PDF</span>
                                                        </div>
                                                    </a>
                                                ) : (
                                                    <a
                                                        href={filePath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block"
                                                    >
                                                        <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-gray-200 hover:border-primary-400 transition-colors flex items-center justify-center cursor-pointer">
                                                            <span className="text-4xl">📄</span>
                                                        </div>
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Document Info */}
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {document.document_type_label || document.document_type}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    document.status === "verified"
                                                        ? "bg-green-100 text-green-800"
                                                        : document.status === "rejected"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                }`}>
                                                    {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                                                </span>
                                            </div>
                                            {document.document_number && (
                                                <p className="text-gray-600 mb-2">
                                                    <span className="font-semibold">Number:</span> {document.document_number}
                                                </p>
                                            )}
                                            {document.admin_notes && (
                                                <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-primary-500">
                                                    <p className="text-sm text-gray-700">
                                                        <span className="font-semibold">Admin Note:</span> {document.admin_notes}
                                                    </p>
                                                </div>
                                            )}
                                            <p className="text-gray-500 text-sm mt-auto">
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
                                                    className="bg-primary-100 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-200 transition duration-300 font-medium text-sm"
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
                    <div className="text-center py-16 bg-white rounded-2xl shadow-xl">
                        <div className="text-6xl mb-4">📄</div>
                        <p className="text-gray-600 text-xl mb-6">No documents uploaded yet</p>
                        <p className="text-gray-500 mb-8">Upload verification documents to get verified</p>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg font-semibold inline-block"
                        >
                            Upload Document
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


