import api from "./api";

export const profileService = {
    async getProfile() {
        const response = await api.get("/profile");
        return response.data;
    },

    async updateProfile(data) {
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
};

