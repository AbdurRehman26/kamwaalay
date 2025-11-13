import api from "./api";

export const messagesService = {
    /**
     * Get all conversations for the current user
     */
    async getConversations() {
        const response = await api.get("/conversations");
        return response.data;
    },

    /**
     * Get messages for a conversation
     */
    async getMessages(conversationId, page = 1) {
        const response = await api.get(`/conversations/${conversationId}/messages`, {
            params: { page },
        });
        return response.data;
    },

    /**
     * Send a message
     */
    async sendMessage(recipientId, message) {
        const response = await api.post("/messages", {
            recipient_id: recipientId,
            message: message,
        });
        return response.data;
    },
};

