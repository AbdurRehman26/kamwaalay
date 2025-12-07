import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Modal from "./Modal";

export default function LogoutModal({ show, onClose }) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);

    const handleLogout = async () => {
        setProcessing(true);
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Logout error:", error);
            navigate("/login");
        } finally {
            setProcessing(false);
            onClose();
        }
    };

    return (
        <Modal show={show} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Confirm Logout
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 mb-6">
                    Are you sure you want to logout? You will need to login again to access your account.
                </p>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleLogout}
                        disabled={processing}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                        {processing ? "Logging out..." : "Logout"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}






