import { useState } from "react";
import Modal from "./Modal";

export default function RemoveWorkerModal({ show, onClose, worker, onConfirm }) {
    const [processing, setProcessing] = useState(false);

    const handleRemove = async () => {
        if (!worker) return;
        
        setProcessing(true);
        try {
            await onConfirm(worker.id);
            onClose();
        } catch (error) {
            console.error("Error removing worker:", error);
            // Error is handled by parent component
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Modal show={show} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Remove Worker
                </h2>

                <p className="mt-1 text-sm text-gray-600 mb-6">
                    Are you sure you want to remove <span className="font-semibold">{worker?.name || "this worker"}</span> from your agency? This action cannot be undone.
                </p>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleRemove}
                        disabled={processing}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                        {processing ? "Removing..." : "Remove Worker"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

