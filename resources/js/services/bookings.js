import api from "./api";

export const bookingsService = {
    async getBookings(params = {}) {
        const response = await api.get("/bookings", { params });
        return response.data;
    },

    async getBooking(id) {
        // Use service-requests endpoint for public viewing
        const response = await api.get(`/service-requests/${id}`);
        return response.data;
    },

    async createBooking(data) {
        const response = await api.post("/bookings", data);
        return response.data;
    },

    async updateBooking(id, data) {
        const response = await api.put(`/bookings/${id}`, data);
        return response.data;
    },

    async deleteBooking(id) {
        const response = await api.delete(`/bookings/${id}`);
        return response.data;
    },

    async browseBookings(params = {}) {
        const response = await api.get("/bookings/browse", { params });
        return response.data;
    },

    async getBookingCreatePrefill() {
        const response = await api.get("/bookings/create");
        return response.data;
    },
};

