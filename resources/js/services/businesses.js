import api from './api';

export const businessesService = {
    async getBusinesses(params = {}) {
        const response = await api.get('/businesses', { params });
        return response.data;
    },

    async getBusiness(id) {
        const response = await api.get(`/businesses/${id}`);
        return response.data;
    },

    async getDashboard() {
        const response = await api.get('/business/dashboard');
        return response.data;
    },

    async getWorkers() {
        const response = await api.get('/business/workers');
        return response.data;
    },

    async createWorker(data) {
        const response = await api.post('/business/workers', data);
        return response.data;
    },

    async updateWorker(id, data) {
        const response = await api.put(`/business/workers/${id}`, data);
        return response.data;
    },

    async deleteWorker(id) {
        const response = await api.delete(`/business/workers/${id}`);
        return response.data;
    },

    async getWorkerCreate() {
        const response = await api.get('/business/workers/create');
        return response.data;
    },

    async getWorkerEdit(id) {
        const response = await api.get(`/business/workers/${id}/edit`);
        return response.data;
    },
};

