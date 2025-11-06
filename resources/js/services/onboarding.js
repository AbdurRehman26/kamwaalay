import api from './api';

export const onboardingService = {
    async getHelper() {
        const response = await api.get('/onboarding/helper');
        return response.data;
    },

    async completeHelper(data) {
        const response = await api.post('/onboarding/helper', data);
        return response.data;
    },

    async getBusiness() {
        const response = await api.get('/onboarding/business');
        return response.data;
    },

    async completeBusiness(data) {
        const response = await api.post('/onboarding/business', data);
        return response.data;
    },
};

