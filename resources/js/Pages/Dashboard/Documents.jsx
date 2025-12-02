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
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
                            <p className="text-sm text-gray-600">Manage your verification documents</p>
                        </div>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-300 font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                            <span>+</span>
                            <span>Upload Document</span>
                        </button>
                    </div>
                </div>

                {/* Verification Status */}
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                    {/* Onboarding Status */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
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
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
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
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Uploaded Documents</h3>
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg">📄</span>
                        </div>
                    </div>
                    {loadingDocuments ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                            <p className="text-gray-600 mt-3 text-sm">Loading documents...</p>
                        </div>
                    ) : documents.length > 0 ? (
                        <div className="space-y-3">
                            {documents.map((document) => (
                                <div key={document.id} className="border-2 border-gray-100 rounded-lg p-4 hover:border-primary-200 hover:shadow-md transition-all duration-300">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                                                    <span className="text-lg">📋</span>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-base font-bold text-gray-900 mb-1">
                                                        {document.document_type_label || document.document_type}
                                                    </h4>
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                                        document.status === "verified" 
                                                            ? "bg-green-100 text-green-700"
                                                            : document.status === "rejected"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                    }`}>
                                                        {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            {document.document_number && (
                                                <p className="text-xs text-gray-600 mb-1 ml-13">
                                                    <span className="font-semibold">Number:</span> {document.document_number}
                                                </p>
                                            )}
                                            {document.admin_notes && (
                                                <div className="ml-13 mt-2 p-2 bg-gray-50 rounded-lg border-l-4 border-primary-500">
                                                    <p className="text-xs text-gray-700">
                                                        <span className="font-semibold">Admin Note:</span> {document.admin_notes}
                                                    </p>
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-500 mt-2 ml-13">
                                                Uploaded: {new Date(document.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {document.file_path && (
                                            <a
                                                href={`/storage/${document.file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-3 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-300 font-semibold text-xs shadow-md hover:shadow-lg"
                                            >
                                                View
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <div className="text-4xl mb-3">📄</div>
                            <p className="text-gray-600 font-medium mb-1 text-sm">No documents uploaded yet.</p>
                            <p className="text-xs text-gray-500 mb-4">Upload verification documents to get verified.</p>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-300 font-semibold text-sm shadow-md hover:shadow-lg"
                            >
                                Upload Your First Document
                            </button>
                        </div>
                    )}
                </div>
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

