import api from "./api";

export const contactService = {
    /**
     * Send a contact form message
     */
    async sendMessage(data) {
        const response = await api.post("/contact", data);
        return response.data;
    },
};

