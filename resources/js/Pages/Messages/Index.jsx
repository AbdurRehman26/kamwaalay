import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { messagesService } from "@/services/messages";
import { authService } from "@/services/auth";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Pusher from "pusher-js";

export default function MessagesIndex() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
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
                setMessages((prev) => [data.message, ...prev]);
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
            setMessages((data.messages?.data || []).reverse()); // Reverse to show oldest first
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
            const data = await messagesService.sendMessage(recipientId, newMessage.trim());
            setMessages((prev) => [data.message, ...prev]);
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
            alert("Failed to send message. Please try again.");
        } finally {
            setSending(false);
        }
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Messages</h2>}>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="flex h-[600px]">
                            {/* Conversations List */}
                            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                                <div className="p-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
                                </div>
                                {loading ? (
                                    <div className="p-4 text-center text-gray-500">Loading...</div>
                                ) : conversations.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">No conversations yet</div>
                                ) : (
                                    <div className="divide-y divide-gray-200">
                                        {conversations.map((conversation) => (
                                            <button
                                                key={conversation.id}
                                                onClick={() => handleSelectConversation(conversation)}
                                                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                                                    selectedConversation?.id === conversation.id ? "bg-blue-50" : ""
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0">
                                                        {conversation.other_user.photo ? (
                                                            <img
                                                                src={`/storage/${conversation.other_user.photo}`}
                                                                alt={conversation.other_user.name}
                                                                className="w-12 h-12 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-xl">
                                                                👤
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {conversation.other_user.name}
                                                            </p>
                                                            {conversation.unread_count > 0 && (
                                                                <span className="flex-shrink-0 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                                                    {conversation.unread_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {conversation.last_message && (
                                                            <p className="text-sm text-gray-500 truncate mt-1">
                                                                {conversation.last_message.message}
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
                            <div className="flex-1 flex flex-col">
                                {selectedConversation ? (
                                    <>
                                        {/* Chat Header */}
                                        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                                            {selectedConversation.other_user.photo ? (
                                                <img
                                                    src={`/storage/${selectedConversation.other_user.photo}`}
                                                    alt={selectedConversation.other_user.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                    👤
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {selectedConversation.other_user.name}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Messages */}
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            {messages.map((message) => {
                                                const isOwnMessage = message.sender_id === user?.id;
                                                return (
                                                    <div
                                                        key={message.id}
                                                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                                                    >
                                                        <div
                                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                                isOwnMessage
                                                                    ? "bg-blue-600 text-white"
                                                                    : "bg-gray-200 text-gray-900"
                                                            }`}
                                                        >
                                                            <p className="text-sm">{message.message}</p>
                                                            <p
                                                                className={`text-xs mt-1 ${
                                                                    isOwnMessage ? "text-blue-100" : "text-gray-500"
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

                                        {/* Message Input */}
                                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    placeholder="Type a message..."
                                                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    disabled={sending}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!newMessage.trim() || sending}
                                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {sending ? "Sending..." : "Send"}
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-gray-500">
                                        Select a conversation to start messaging
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

