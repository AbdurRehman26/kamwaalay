import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { messagesService } from "@/services/messages";
import { authService } from "@/services/auth";
import Pusher from "pusher-js";

export default function ChatPopup({ recipientId, recipientName, recipientPhoto, isOpen, onClose }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const messagesEndRef = useRef(null);
    const pusherRef = useRef(null);
    const channelRef = useRef(null);
    const conversationIdRef = useRef(null);

    // Initialize Pusher
    useEffect(() => {
        if (!user || !isOpen) return;

        const token = authService.getToken() || "";
        
        pusherRef.current = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY || "", {
            cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || "mt1",
            authEndpoint: "/api/broadcasting/auth",
            auth: {
                headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                    Accept: "application/json",
                },
            },
        });

        return () => {
            if (channelRef.current) {
                pusherRef.current.unsubscribe(channelRef.current.name);
            }
            if (pusherRef.current) {
                pusherRef.current.disconnect();
            }
        };
    }, [user, isOpen]);

    // Load or create conversation and messages
    useEffect(() => {
        if (!isOpen || !recipientId || !user) return;

        const loadConversationAndMessages = async () => {
            setLoading(true);
            setError("");
            
            try {
                // First, try to get existing conversations to find if one exists with this recipient
                const conversationsData = await messagesService.getConversations();
                const conversations = conversationsData.conversations || [];
                
                const existingConversation = conversations.find(
                    (conv) => conv.other_user?.id === recipientId
                );

                if (existingConversation) {
                    conversationIdRef.current = existingConversation.id;
                    // Load messages for existing conversation
                    const messagesData = await messagesService.getMessages(existingConversation.id);
                    setMessages(messagesData.messages?.data || []);
                    
                    // Subscribe to conversation channel
                    if (pusherRef.current) {
                        const channelName = `conversation.${existingConversation.id}`;
                        channelRef.current = pusherRef.current.subscribe(channelName);
                        
                        channelRef.current.bind("message.sent", (data) => {
                            if (data.message) {
                                setMessages((prev) => [...prev, data.message]);
                            }
                        });
                    }
                } else {
                    // No existing conversation, start with empty messages
                    setMessages([]);
                }
            } catch (error) {
                console.error("Error loading conversation:", error);
                setError("Failed to load conversation");
            } finally {
                setLoading(false);
            }
        };

        loadConversationAndMessages();
    }, [isOpen, recipientId, user]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current && messages.length > 0) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending || !recipientId) return;

        setSending(true);
        setError("");

        try {
            const data = await messagesService.sendMessage(recipientId, newMessage.trim());
            
            // Add the new message to the list
            setMessages((prev) => [...prev, data.message]);
            setNewMessage("");
            
            // Update conversation ID if this is a new conversation
            if (data.conversation && !conversationIdRef.current) {
                conversationIdRef.current = data.conversation.id;
                
                // Subscribe to new conversation channel
                if (pusherRef.current) {
                    const channelName = `conversation.${data.conversation.id}`;
                    channelRef.current = pusherRef.current.subscribe(channelName);
                    
                    channelRef.current.bind("message.sent", (data) => {
                        if (data.message) {
                            setMessages((prev) => [...prev, data.message]);
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage = error.response?.data?.message || "Failed to send message. Please try again.";
            setError(errorMessage);
            setTimeout(() => setError(""), 5000);
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 pointer-events-auto"
                onClick={onClose}
            />
            
            {/* Chat Popup */}
            <div className="relative w-full max-w-md h-[600px] bg-white rounded-t-2xl shadow-2xl flex flex-col pointer-events-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        {recipientPhoto ? (
                            <img
                                src={recipientPhoto.startsWith("http") ? recipientPhoto : `/storage/${recipientPhoto}`}
                                alt={recipientName}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                                {recipientName?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                        )}
                        <div>
                            <h3 className="font-semibold">{recipientName || "User"}</h3>
                            <p className="text-xs text-white/80">Online</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition-colors p-2"
                        title="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">Loading messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <p className="text-gray-500 mb-2">No messages yet</p>
                                <p className="text-sm text-gray-400">Start a conversation with {recipientName}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message) => {
                                const isOwnMessage = message.sender_id === user?.id;
                                return (
                                    <div
                                        key={message.id}
                                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                                isOwnMessage
                                                    ? "bg-primary-600 text-white"
                                                    : "bg-white text-gray-900 border border-gray-200"
                                            }`}
                                        >
                                            <p className="text-sm">{message.message}</p>
                                            <p
                                                className={`text-xs mt-1 ${
                                                    isOwnMessage ? "text-primary-100" : "text-gray-500"
                                                }`}
                                            >
                                                {new Date(message.created_at).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            disabled={sending}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}












