import PublicLayout from "@/Layouts/PublicLayout";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { route } from "@/utils/routes";
import { notificationsService } from "@/services/notifications";
import PrimaryButton from "@/Components/PrimaryButton";

export default function NotificationsIndex() {
    const [notifications, setNotifications] = useState({ data: [], links: [], meta: {} });
    const [loading, setLoading] = useState(true);
    const [markingAllRead, setMarkingAllRead] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async (page = 1) => {
        setLoading(true);
        try {
            const data = await notificationsService.getNotifications(page, 20);
            setNotifications(data.notifications || { data: [], links: [], meta: {} });
        } catch (error) {
            console.error("Error loading notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationsService.markAsRead(notificationId);
            setNotifications(prev => ({
                ...prev,
                data: prev.data.map(n => 
                    n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
                ),
            }));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        setMarkingAllRead(true);
        try {
            await notificationsService.markAllAsRead();
            setNotifications(prev => ({
                ...prev,
                data: prev.data.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })),
            }));
        } catch (error) {
            console.error("Error marking all as read:", error);
        } finally {
            setMarkingAllRead(false);
        }
    };

    const handlePageChange = (page) => {
        loadNotifications(page);
    };

    const getNotificationLink = (notification) => {
        const data = notification.data;
        switch (data.type) {
            case 'job_application_received':
                return route("job-applications.my-request-applications");
            case 'job_application_status_changed':
                if (data.application_id) {
                    return route("job-applications.show", data.application_id);
                }
                return route("job-applications.my-applications");
            case 'new_message':
                return route("messages");
            case 'document_verified':
                return route("dashboard");
            default:
                return route("dashboard");
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'job_application_received':
            case 'job_application_status_changed':
                return '📋';
            case 'new_message':
                return '💬';
            case 'document_verified':
                return '📄';
            default:
                return '🔔';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'job_application_received':
                return 'bg-blue-100 text-blue-800';
            case 'job_application_status_changed':
                return 'bg-green-100 text-green-800';
            case 'new_message':
                return 'bg-purple-100 text-purple-800';
            case 'document_verified':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <PublicLayout>
            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                                <p className="text-sm text-gray-600 mt-1">Stay updated with your activity</p>
                            </div>
                            {notifications.data && notifications.data.length > 0 && (
                                <PrimaryButton
                                    onClick={handleMarkAllAsRead}
                                    disabled={markingAllRead}
                                >
                                    {markingAllRead ? "Marking..." : "Mark All Read"}
                                </PrimaryButton>
                            )}
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                                <p className="text-gray-600">Loading notifications...</p>
                            </div>
                        ) : notifications.data && notifications.data.length > 0 ? (
                            <>
                                <div className="space-y-3">
                                    {notifications.data.map((notification) => {
                                        const isUnread = !notification.read_at;
                                        const link = getNotificationLink(notification);
                                        const icon = getNotificationIcon(notification.data?.type);
                                        const colorClass = getNotificationColor(notification.data?.type);

                                        return (
                                            <Link
                                                key={notification.id}
                                                to={link}
                                                onClick={() => {
                                                    if (isUnread) {
                                                        handleMarkAsRead(notification.id);
                                                    }
                                                }}
                                                className={`block p-4 rounded-lg border-2 transition-all ${
                                                    isUnread 
                                                        ? 'border-primary-300 bg-primary-50 hover:bg-primary-100' 
                                                        : 'border-gray-100 bg-white hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colorClass}`}>
                                                        {icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h3 className={`text-base font-bold ${
                                                                isUnread ? 'text-gray-900' : 'text-gray-700'
                                                            }`}>
                                                                {notification.data?.title || 'Notification'}
                                                            </h3>
                                                            {isUnread && (
                                                                <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0"></span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            {notification.data?.message || ''}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(notification.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {notifications.links && notifications.links.length > 1 && (
                                    <div className="mt-6 flex justify-center items-center gap-2">
                                        {notifications.links.map((link, index) => {
                                            if (link.url === null) {
                                                return (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-2 text-gray-400 border border-gray-200 rounded-lg"
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                );
                                            }

                                            const page = link.url ? new URL(link.url).searchParams.get('page') : null;
                                            const isActive = link.active;

                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => page && handlePageChange(page)}
                                                    className={`px-4 py-2 rounded-lg border transition-colors ${
                                                        isActive
                                                            ? 'bg-primary-600 text-white border-primary-600'
                                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🔔</div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No notifications yet</h3>
                                <p className="text-gray-600 mb-6">You'll see notifications here when there's activity on your account.</p>
                                <Link
                                    to={route("dashboard")}
                                    className="inline-block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition duration-300 font-semibold shadow-md hover:shadow-lg"
                                >
                                    Go to Dashboard
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

