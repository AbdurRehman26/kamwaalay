import api from "./api";

export const jobApplicationsService = {
    async getApplications(params = {}) {
        const response = await api.get("/job-applications", { params });
        return response.data;
    },

    async getApplication(id) {
        const response = await api.get(`/job-applications/${id}`);
        return response.data;
    },

    async createApplication(bookingId, data) {
        const response = await api.post(`/job-applications/${bookingId}/apply`, data);
        return response.data;
    },

    async acceptApplication(id) {
        const response = await api.post(`/job-applications/${id}/accept`);
        return response.data;
    },

    async rejectApplication(id) {
        const response = await api.post(`/job-applications/${id}/reject`);
        return response.data;
    },

    async withdrawApplication(id) {
        const response = await api.post(`/job-applications/${id}/withdraw`);
        return response.data;
    },

    async deleteApplication(id) {
        const response = await api.delete(`/job-applications/${id}`);
        return response.data;
    },

    async getMyApplications() {
        const response = await api.get("/job-applications/my-applications");
        return response.data;
    },

    async getMyRequestApplications() {
        const response = await api.get("/job-applications/my-request-applications");
        return response.data;
    },

    async getApplicationCreate(bookingId) {
        const response = await api.get(`/job-applications/${bookingId}/apply`);
        return response.data;
    },
};

