import { useState, useRef } from "react";
import Modal from "@/Components/Modal";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import { profileService } from "@/services/profile";

export default function UploadDocumentModal({ isOpen, onClose, onSuccess }) {
    const [data, setData] = useState({
        document_type: "nic",
        document_number: "",
    });
    const [file, setFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file size (5MB max)
            if (selectedFile.size > 5 * 1024 * 1024) {
                setErrors({ file: ["File size must be less than 5MB"] });
                return;
            }
            // Validate file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(selectedFile.type)) {
                setErrors({ file: ["File must be PDF, JPG, or PNG"] });
                return;
            }
            setErrors({});
            setFile(selectedFile);
        }
    };

    const removeFile = () => {
        setFile(null);
        setErrors({});
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!file) {
            setErrors({ file: ["Please select a file"] });
            return;
        }

        setProcessing(true);
        setErrors({});

        try {
            const formData = new FormData();
            formData.append('document_type', data.document_type);
            if (data.document_number) {
                formData.append('document_number', data.document_number);
            }
            formData.append('file', file);

            await profileService.uploadDocument(formData);
            onSuccess();
            handleClose();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: [error.response?.data?.message || "Failed to upload document"] });
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        setData({
            document_type: "nic",
            document_number: "",
        });
        setFile(null);
        setErrors({});
        removeFile();
        onClose();
    };

    return (
        <Modal show={isOpen} onClose={handleClose}>
            <form onSubmit={submit} className="p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Document</h2>
                    <p className="text-sm text-gray-600">Upload a verification document (NIC, Aadhaar, Police Verification, etc.)</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <InputLabel htmlFor="document_type" value="Document Type" />
                        <select
                            id="document_type"
                            value={data.document_type}
                            onChange={(e) => setData({ ...data, document_type: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="nic">National Identity Card (NIC)</option>
                            <option value="police_verification">Police Verification</option>
                            <option value="other">Other Document</option>
                        </select>
                        <InputError className="mt-2" message={errors.document_type} />
                    </div>

                    <div>
                        <InputLabel htmlFor="document_number" value="Document Number (Optional)" />
                        <input
                            id="document_number"
                            type="text"
                            value={data.document_number}
                            onChange={(e) => setData({ ...data, document_number: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            placeholder="Enter document number if applicable"
                        />
                        <InputError className="mt-2" message={errors.document_number} />
                    </div>

                    <div>
                        <InputLabel htmlFor="file" value="Document File" />
                        <div className="mt-2">
                            {file ? (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removeFile}
                                        className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <input
                                    ref={fileInputRef}
                                    id="file"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                                />
                            )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">PDF, JPG, or PNG up to 5MB</p>
                        <InputError className="mt-2" message={errors.file} />
                    </div>

                    {errors.submit && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors.submit}</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={handleClose} disabled={processing}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={processing || !file}>
                        {processing ? "Uploading..." : "Upload Document"}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}

