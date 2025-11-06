import api from './api';

export const serviceListingsService = {
    async getListings(params = {}) {
        const response = await api.get('/service-listings', { params });
        return response.data;
    },

    async getListing(id) {
        const response = await api.get(`/service-listings/${id}`);
        return response.data;
    },

    async createListing(data) {
        const response = await api.post('/service-listings', data);
        return response.data;
    },

    async updateListing(id, data) {
        const response = await api.put(`/service-listings/${id}`, data);
        return response.data;
    },

    async deleteListing(id) {
        const response = await api.delete(`/service-listings/${id}`);
        return response.data;
    },

    async getMyListings() {
        const response = await api.get('/service-listings/my-listings');
        return response.data;
    },
};

