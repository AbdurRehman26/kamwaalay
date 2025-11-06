import api from './api';

export const helpersService = {
    // Get helpers list
    async getHelpers(params = {}) {
        const response = await api.get('/helpers', { params });
        return response.data;
    },

    // Get helper details
    async getHelper(id) {
        const response = await api.get(`/helpers/${id}`);
        return response.data;
    },

    // Create helper profile
    async createHelper(data) {
        const response = await api.post('/helpers', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Update helper profile
    async updateHelper(id, data) {
        const response = await api.put(`/helpers/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

