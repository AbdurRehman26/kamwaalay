import api from "./api";

export const profileService = {
    async getProfile() {
        const response = await api.get("/profile");
        return response.data;
    },

    async updateProfile(data) {
        // FormData handling is done automatically by api.js interceptor
        // It will remove Content-Type header to let browser set it with boundary
        const response = await api.patch("/profile", data);
        return response.data;
    },

    async updatePassword(data) {
        const response = await api.put("/password", data);
        return response.data;
    },

    async deleteProfile(password) {
        const response = await api.delete("/profile", {
            data: { password },
        });
        return response.data;
    },

    async getDocuments() {
        const response = await api.get("/profile/documents");
        return response.data;
    },

    async updatePhoto(formData) {
        // FormData handling is done automatically by api.js interceptor
        // It will remove Content-Type header to let browser set it with boundary
        const response = await api.post("/profile/photo", formData);
        return response.data;
    },

    async uploadDocument(formData) {
        // FormData handling is done automatically by api.js interceptor
        const response = await api.post("/profile/documents", formData);
        return response.data;
    },
};

