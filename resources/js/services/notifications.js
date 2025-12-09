import api from "./api";

export const notificationsService = {
    async getNotifications(page = 1, perPage = 15) {
        const response = await api.get("/notifications", {
            params: { page, per_page: perPage },
        });
        return response.data;
    },

    async getUnreadCount() {
        const response = await api.get("/notifications/unread-count");
        return response.data;
    },

    async markAsRead(notificationId) {
        const response = await api.post(`/notifications/${notificationId}/read`);
        return response.data;
    },

    async markAllAsRead() {
        const response = await api.post("/notifications/mark-all-read");
        return response.data;
    },
};














