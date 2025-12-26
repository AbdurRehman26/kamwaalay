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
     * Create or get existing conversation
     */
    async createConversation(recipientId) {
        const response = await api.post("/conversations", {
            recipient_id: recipientId
        });
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

    /**
     * Delete a conversation
     */
    async deleteConversation(conversationId) {
        const response = await api.delete(`/conversations/${conversationId}`);
        return response.data;
    },

    /**
     * Delete a message
     */
    async deleteMessage(messageId) {
        const response = await api.delete(`/messages/${messageId}`);
        return response.data;
    },
};

