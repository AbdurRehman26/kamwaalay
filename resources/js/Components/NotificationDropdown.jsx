import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { route } from "@/utils/routes";
import { notificationsService } from "@/services/notifications";

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState({ data: [], links: [], meta: {} });
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        loadUnreadCount();
        if (isOpen) {
            loadNotifications();
        }

        // Refresh unread count every 30 seconds
        const interval = setInterval(() => {
            loadUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await notificationsService.getNotifications(1, 10);
            setNotifications(data.notifications || { data: [], links: [], meta: {} });
        } catch (error) {
            console.error("Error loading notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const data = await notificationsService.getUnreadCount();
            setUnreadCount(data.unread_count || 0);
        } catch (error) {
            console.error("Error loading unread count:", error);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationsService.markAsRead(notificationId);
            // Update notification in list
            setNotifications(prev => ({
                ...prev,
                data: prev.data.map(n => 
                    n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
                ),
            }));
            // Update unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsService.markAllAsRead();
            // Update all notifications
            setNotifications(prev => ({
                ...prev,
                data: prev.data.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })),
            }));
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const getNotificationLink = (notification) => {
        const data = notification.data;
        switch (data.type) {
            case "job_application_received":
                return route("job-applications.my-request-applications");
            case "job_application_status_changed":
                if (data.application_id) {
                    return route("job-applications.show", data.application_id);
                }
                return route("job-applications.my-applications");
            case "new_message":
                return route("messages");
            case "document_verified":
                return route("dashboard");
            default:
                return route("dashboard");
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "job_application_received":
            case "job_application_status_changed":
                return "📋";
            case "new_message":
                return "💬";
            case "document_verified":
                return "📄";
            default:
                return "🔔";
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 rounded-lg transition-colors"
            >
                <span className="text-2xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 dark:bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 dark:border-primary-400"></div>
                                <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm">Loading notifications...</p>
                            </div>
                        ) : notifications.data && notifications.data.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {notifications.data.map((notification) => {
                                    const isUnread = !notification.read_at;
                                    const link = getNotificationLink(notification);
                                    const icon = getNotificationIcon(notification.data?.type);

                                    return (
                                        <Link
                                            key={notification.id}
                                            to={link}
                                            onClick={() => {
                                                if (isUnread) {
                                                    handleMarkAsRead(notification.id);
                                                }
                                                setIsOpen(false);
                                            }}
                                            className={`block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                                                isUnread ? "bg-primary-50 dark:bg-primary-900/20" : ""
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">{icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold ${
                                                        isUnread ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                                                    }`}>
                                                        {notification.data?.title || "Notification"}
                                                    </p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                        {notification.data?.message || ""}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                        {new Date(notification.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                {isUnread && (
                                                    <span className="w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full mt-2 flex-shrink-0"></span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="text-4xl mb-3">🔔</div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">No notifications yet</p>
                            </div>
                        )}
                    </div>

                    {notifications.data && notifications.data.length > 0 && (
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                            <Link
                                to={route("notifications")}
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                            >
                                View all notifications
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

