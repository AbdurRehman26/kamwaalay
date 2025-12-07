import api from "./api";

export const bookingsService = {
    async getBookings(params = {}) {
        const response = await api.get("/my-job-posts", { params });
        return response.data;
    },

    async getBooking(id) {
        // Use bookings endpoint for public viewing
        const response = await api.get(`/bookings/${id}`);
        return response.data;
    },

    async createBooking(data) {
        const response = await api.post("/job-posts", data);
        return response.data;
    },

    async updateBooking(id, data) {
        const response = await api.patch(`/job-posts/${id}`, data);
        return response.data;
    },

    async deleteBooking(id) {
        const response = await api.delete(`/job-posts/${id}`);
        return response.data;
    },

    async browseBookings(params = {}) {
        const response = await api.get("/bookings/browse", { params });
        return response.data;
    },

    async getBookingCreatePrefill() {
        const response = await api.get("/job-posts/create");
        return response.data;
    },
};

