import api from "./api";

export const homeService = {
    // Get home data
    async getHomeData() {
        const response = await api.get("/home");
        return response.data;
    },
};

