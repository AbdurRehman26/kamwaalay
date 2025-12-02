import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { messagesService } from "@/services/messages";
import { authService } from "@/services/auth";
import DashboardLayout from "@/Layouts/DashboardLayout";
import Pusher from "pusher-js";

export default function MessagesIndex() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const messagesEndRef = useRef(null);
    const pusherRef = useRef(null);
    const channelRef = useRef(null);

    // Initialize Pusher
    useEffect(() => {
        if (!user) return;

        // Get auth token
        const token = authService.getToken() || "";
        
        // Initialize Pusher
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
    }, [user]);

    // Load conversations
    useEffect(() => {
        loadConversations();
    }, []);

    // Subscribe to conversation channel when selected
    useEffect(() => {
        if (!selectedConversation || !pusherRef.current) return;

        // Unsubscribe from previous channel
        if (channelRef.current) {
            pusherRef.current.unsubscribe(channelRef.current.name);
        }

        // Subscribe to new channel
        const channelName = `conversation.${selectedConversation.id}`;
        channelRef.current = pusherRef.current.subscribe(channelName);

        channelRef.current.bind("message.sent", (data) => {
            if (data.message && data.conversation_id === selectedConversation.id) {
                setMessages((prev) => [...prev, data.message]);
                // Update conversation list
                setConversations((prev) =>
                    prev.map((conv) =>
                        conv.id === selectedConversation.id
                            ? {
                                  ...conv,
                                  last_message: data.message,
                                  updated_at: data.message.created_at,
                                  unread_count: 0,
                              }
                            : conv
                    )
                );
            } else if (data.conversation_id !== selectedConversation.id) {
                // Message for a different conversation - reload list
                loadConversations();
            }
        });

        return () => {
            if (channelRef.current) {
                pusherRef.current.unsubscribe(channelName);
            }
        };
    }, [selectedConversation]);

    const loadConversations = async () => {
        try {
            setLoading(true);
            const data = await messagesService.getConversations();
            setConversations(data.conversations || []);
        } catch (error) {
            console.error("Error loading conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversationId) => {
        try {
            const data = await messagesService.getMessages(conversationId);
            setMessages(data.messages?.data || []); // Messages are already in ascending order (oldest first)
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        loadMessages(conversation.id);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || sending) return;

        const recipientId = selectedConversation.other_user.id;
        setSending(true);

        try {
            setError("");
            const data = await messagesService.sendMessage(recipientId, newMessage.trim());
            setMessages((prev) => [...prev, data.message]);
            setNewMessage("");
            
            // Update conversation list
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === selectedConversation.id
                        ? {
                              ...conv,
                              last_message: data.message,
                              updated_at: data.message.created_at,
                          }
                        : conv
                )
            );
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage = error.response?.data?.message || "Failed to send message. Please try again.";
            setError(errorMessage);
            // Clear error after 5 seconds
            setTimeout(() => setError(""), 5000);
        } finally {
            setSending(false);
        }
    };

    // Scroll to bottom when new messages arrive (not when loading existing messages)
    useEffect(() => {
        // Only scroll if we're at or near the bottom (user hasn't scrolled up to read old messages)
        if (messagesEndRef.current && messages.length > 0) {
            const container = messagesEndRef.current.parentElement;
            if (container) {
                const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
                if (isNearBottom) {
                    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                }
            }
        }
    }, [messages]);

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
                        <p className="text-gray-600">Chat with your contacts</p>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="flex h-[calc(100vh-250px)] min-h-[600px]">
                            {/* Conversations List */}
                            <div className="w-full md:w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
                                <div className="p-4 border-b border-gray-200 bg-white">
                                    <h3 className="text-lg font-bold text-gray-900">Conversations</h3>
                                </div>
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mb-3"></div>
                                        <p className="text-gray-500 text-sm">Loading conversations...</p>
                                    </div>
                                ) : conversations.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="text-4xl mb-3">💬</div>
                                        <p className="text-gray-500 text-sm">No conversations yet</p>
                                        <p className="text-gray-400 text-xs mt-1">Start a conversation by contacting someone</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200">
                                        {conversations.map((conversation) => (
                                            <button
                                                key={conversation.id}
                                                onClick={() => handleSelectConversation(conversation)}
                                                className={`w-full p-4 text-left hover:bg-white transition-all duration-200 ${
                                                    selectedConversation?.id === conversation.id ? "bg-white border-l-4 border-primary-600" : ""
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0">
                                                        {conversation.other_user.photo ? (
                                                            <img
                                                                src={`/storage/${conversation.other_user.photo}`}
                                                                alt={conversation.other_user.name}
                                                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                                {conversation.other_user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                                {conversation.other_user.name}
                                                            </p>
                                                            {conversation.unread_count > 0 && (
                                                                <span className="flex-shrink-0 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                                                                    {conversation.unread_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {conversation.last_message && (
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {conversation.last_message.message}
                                                            </p>
                                                        )}
                                                        {conversation.last_message && (
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {new Date(conversation.last_message.created_at).toLocaleDateString() === new Date().toLocaleDateString()
                                                                    ? new Date(conversation.last_message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                                                    : new Date(conversation.last_message.created_at).toLocaleDateString([], { month: "short", day: "numeric" })
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 flex flex-col hidden md:flex">
                                {selectedConversation ? (
                                    <>
                                        {/* Chat Header */}
                                        <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3 shadow-sm">
                                            {selectedConversation.other_user.photo ? (
                                                <img
                                                    src={`/storage/${selectedConversation.other_user.photo}`}
                                                    alt={selectedConversation.other_user.name}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold shadow-md">
                                                    {selectedConversation.other_user.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-gray-900">
                                                    {selectedConversation.other_user.name}
                                                </p>
                                                <p className="text-xs text-gray-500">Online</p>
                                            </div>
                                        </div>

                                        {/* Messages */}
                                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                                            {messages.length === 0 ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <div className="text-center">
                                                        <div className="text-5xl mb-3">💬</div>
                                                        <p className="text-gray-500">No messages yet</p>
                                                        <p className="text-gray-400 text-sm mt-1">Start the conversation!</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                messages.map((message) => {
                                                    const isOwnMessage = message.sender_id === user?.id;
                                                    return (
                                                        <div
                                                            key={message.id}
                                                            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                                                        >
                                                            <div className="flex items-end gap-2 max-w-[70%]">
                                                                {!isOwnMessage && (
                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                                        {message.sender?.name?.charAt(0).toUpperCase() || "U"}
                                                                    </div>
                                                                )}
                                                                <div
                                                                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                                                                        isOwnMessage
                                                                            ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-br-none"
                                                                            : "bg-white text-gray-900 rounded-bl-none border border-gray-200"
                                                                    }`}
                                                                >
                                                                    {!isOwnMessage && (
                                                                        <p className="text-xs font-semibold mb-1 opacity-75">
                                                                            {message.sender?.name || "Unknown"}
                                                                        </p>
                                                                    )}
                                                                    <p className="text-sm leading-relaxed">{message.message}</p>
                                                                    <p
                                                                        className={`text-xs mt-2 ${
                                                                            isOwnMessage ? "text-primary-100" : "text-gray-400"
                                                                        }`}
                                                                    >
                                                                        {new Date(message.created_at).toLocaleTimeString([], {
                                                                            hour: "2-digit",
                                                                            minute: "2-digit",
                                                                        })}
                                                                    </p>
                                                                </div>
                                                                {isOwnMessage && (
                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                                        {user?.name?.charAt(0).toUpperCase() || "U"}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* Message Input */}
                                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                                            {error && (
                                                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <p className="text-sm text-red-600">{error}</p>
                                                </div>
                                            )}
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={(e) => {
                                                        setNewMessage(e.target.value);
                                                        setError(""); // Clear error when typing
                                                    }}
                                                    placeholder="Type a message..."
                                                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                                    disabled={sending}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!newMessage.trim() || sending}
                                                    className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-semibold"
                                                >
                                                    {sending ? "Sending..." : "Send"}
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                                        <div className="text-center">
                                            <div className="text-6xl mb-4">💬</div>
                                            <p className="text-gray-600 font-medium text-lg mb-2">Select a conversation</p>
                                            <p className="text-gray-400 text-sm">Choose a conversation from the list to start messaging</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

