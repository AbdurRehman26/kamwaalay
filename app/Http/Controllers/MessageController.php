<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Notifications\NewMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

/**
 * Message Controller
 * 
 * Handles chat messaging functionality with real-time broadcasting via Pusher.
 * 
 * Broadcasting:
 * - Messages are broadcast in real-time via Pusher to the conversation channel
 * - Channel name: conversation.{conversation_id}
 * - Event name: message.sent
 * - Broadcasting authentication is handled via /broadcasting/auth endpoint
 * 
 * Real-time Events:
 * When a message is sent, it broadcasts to both users in the conversation with:
 * - message: Full message object with sender details
 * - conversation_id: The conversation ID
 */
#[OA\Tag(name: "Messages", description: "Chat messaging endpoints with real-time broadcasting via Pusher")]
class MessageController extends Controller
{

    #[OA\Get(
        path: "/api/conversations",
        summary: "Get user's conversations",
        description: "Get list of all conversations for the authenticated user with last message and unread count",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of conversations",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "conversations",
                            type: "array",
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: "id", type: "integer", example: 1),
                                    new OA\Property(
                                        property: "other_user",
                                        type: "object",
                                        properties: [
                                            new OA\Property(property: "id", type: "integer", example: 2),
                                            new OA\Property(property: "name", type: "string", example: "John Doe"),
                                            new OA\Property(property: "photo", type: "string", nullable: true, example: "/storage/photos/user.jpg"),
                                        ]
                                    ),
                                    new OA\Property(
                                        property: "last_message",
                                        type: "object",
                                        nullable: true,
                                        properties: [
                                            new OA\Property(property: "id", type: "integer", example: 10),
                                            new OA\Property(property: "message", type: "string", example: "Hello, how are you?"),
                                            new OA\Property(property: "sender_id", type: "integer", example: 2),
                                            new OA\Property(property: "created_at", type: "string", format: "date-time", example: "2024-01-15T10:30:00Z"),
                                        ]
                                    ),
                                    new OA\Property(property: "unread_count", type: "integer", example: 3),
                                    new OA\Property(property: "updated_at", type: "string", format: "date-time", example: "2024-01-15T10:30:00Z"),
                                ]
                            )
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
        ]
    )]
    public function getConversations(): JsonResponse
    {
        $user = Auth::user();
        
        $conversations = Conversation::where(function ($query) use ($user) {
                $query->where('user_one_id', $user->id)
                    ->orWhere('user_two_id', $user->id);
            })
            ->with(['userOne.profile', 'userTwo.profile'])
            ->orderBy('last_message_at', 'desc')
            ->get()
            ->filter(function ($conversation) use ($user) {
                // Get user's deletion timestamp
                $deletedAt = $conversation->getDeletedAtForUser($user->id);
                
                // If user hasn't deleted this conversation, show it
                if (!$deletedAt) {
                    return true;
                }
                
                // If user deleted it, only show if there are new messages after deletion
                return $conversation->messages()
                    ->where('created_at', '>', $deletedAt)
                    ->exists();
            })
            ->map(function ($conversation) use ($user) {
                $otherUser = $conversation->getOtherUser($user->id);
                $deletedAt = $conversation->getDeletedAtForUser($user->id);
                
                // Get last message (after deletion timestamp if applicable)
                $lastMessageQuery = $conversation->messages()->latest();
                if ($deletedAt) {
                    $lastMessageQuery->where('created_at', '>', $deletedAt);
                }
                $lastMessage = $lastMessageQuery->first();
                
                // Get unread count (after deletion timestamp if applicable)
                $unreadQuery = $conversation->messages()
                    ->where('sender_id', '!=', $user->id)
                    ->where('is_read', false);
                if ($deletedAt) {
                    $unreadQuery->where('created_at', '>', $deletedAt);
                }
                
                return [
                    'id' => $conversation->id,
                    'other_user' => [
                        'id' => $otherUser->id,
                        'name' => $otherUser->name,
                        'photo' => $otherUser->photo,
                    ],
                    'last_message' => $lastMessage ? [
                        'id' => $lastMessage->id,
                        'message' => $lastMessage->message,
                        'sender_id' => $lastMessage->sender_id,
                        'created_at' => $lastMessage->created_at->toIso8601String(),
                    ] : null,
                    'unread_count' => $unreadQuery->count(),
                    'updated_at' => $conversation->updated_at->toIso8601String(),
                ];
            })
            ->values();

        return response()->json([
            'conversations' => $conversations,
        ]);
    }

    #[OA\Post(
        path: "/api/conversations",
        summary: "Create or get existing conversation",
        description: "Get an existing conversation with a user or create a new one if it doesn't exist.",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["recipient_id"],
                properties: [
                    new OA\Property(
                        property: "recipient_id",
                        type: "integer",
                        description: "ID of the recipient user",
                        example: 2
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Conversation retrieved or created successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "conversation",
                            type: "object",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 1),
                                new OA\Property(
                                    property: "other_user",
                                    type: "object",
                                    properties: [
                                        new OA\Property(property: "id", type: "integer", example: 2),
                                        new OA\Property(property: "name", type: "string", example: "John Doe"),
                                        new OA\Property(property: "photo", type: "string", nullable: true),
                                    ]
                                ),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validation error"),
            new OA\Response(response: 401, description: "Unauthenticated"),
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'recipient_id' => 'required|exists:users,id',
        ]);

        $user = Auth::user();
        $recipientId = $request->recipient_id;

        if ($user->id === $recipientId) {
            return response()->json(['message' => 'Cannot start conversation with yourself'], 422);
        }

        // Get or create conversation
        $conversation = Conversation::getOrCreate($user->id, $recipientId);
        $otherUser = $conversation->getOtherUser($user->id);

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'other_user' => [
                    'id' => $otherUser->id,
                    'name' => $otherUser->name,
                    'photo' => $otherUser->photo,
                ],
            ]
        ]);
    }

    #[OA\Get(
        path: "/api/conversations/{conversation}/messages",
        summary: "Get messages for a conversation",
        description: "Get paginated messages for a specific conversation. Messages are ordered by created_at descending. Unread messages are automatically marked as read when fetched.",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "conversation",
                in: "path",
                required: true,
                description: "Conversation ID",
                schema: new OA\Schema(type: "integer", example: 1)
            ),
            new OA\Parameter(
                name: "page",
                in: "query",
                required: false,
                description: "Page number for pagination",
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Paginated messages",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "messages",
                            type: "object",
                            properties: [
                                new OA\Property(
                                    property: "data",
                                    type: "array",
                                    items: new OA\Items(
                                        properties: [
                                            new OA\Property(property: "id", type: "integer", example: 1),
                                            new OA\Property(property: "conversation_id", type: "integer", example: 1),
                                            new OA\Property(property: "sender_id", type: "integer", example: 1),
                                            new OA\Property(
                                                property: "sender",
                                                type: "object",
                                                properties: [
                                                    new OA\Property(property: "id", type: "integer", example: 1),
                                                    new OA\Property(property: "name", type: "string", example: "John Doe"),
                                                    new OA\Property(property: "photo", type: "string", nullable: true),
                                                ]
                                            ),
                                            new OA\Property(property: "message", type: "string", example: "Hello, how are you?"),
                                            new OA\Property(property: "is_read", type: "boolean", example: true),
                                            new OA\Property(property: "read_at", type: "string", format: "date-time", nullable: true),
                                            new OA\Property(property: "created_at", type: "string", format: "date-time", example: "2024-01-15T10:30:00Z"),
                                            new OA\Property(property: "updated_at", type: "string", format: "date-time", example: "2024-01-15T10:30:00Z"),
                                        ]
                                    )
                                ),
                                new OA\Property(property: "current_page", type: "integer", example: 1),
                                new OA\Property(property: "last_page", type: "integer", example: 5),
                                new OA\Property(property: "per_page", type: "integer", example: 20),
                                new OA\Property(property: "total", type: "integer", example: 100),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - User is not part of this conversation"),
            new OA\Response(response: 401, description: "Unauthenticated"),
        ]
    )]
    public function getMessages(Conversation $conversation, Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // Verify user is part of this conversation
        if ($conversation->user_one_id !== $user->id && $conversation->user_two_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get user's deletion timestamp
        $deletedAt = $conversation->getDeletedAtForUser($user->id);
        
        // Build messages query - filter by deletion timestamp if applicable
        $messagesQuery = $conversation->messages()
            ->with('sender.profile');
        
        if ($deletedAt) {
            $messagesQuery->where('created_at', '>', $deletedAt);
        }
        
        $messages = $messagesQuery
            ->orderBy('created_at', 'asc')
            ->paginate(20);

        // Mark messages as read
        $conversation->messages()
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'messages' => $messages,
        ]);
    }

    #[OA\Post(
        path: "/api/messages",
        summary: "Send a message",
        description: "Send a message to a user. Creates a new conversation if one doesn't exist. The message is broadcast via Pusher to the recipient in real-time. Note: Helpers and businesses can only reply to users who have contacted them first. Users can contact helpers/businesses at any time.",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["recipient_id", "message"],
                properties: [
                    new OA\Property(
                        property: "recipient_id",
                        type: "integer",
                        description: "ID of the recipient user",
                        example: 2
                    ),
                    new OA\Property(
                        property: "message",
                        type: "string",
                        description: "Message content (max 5000 characters)",
                        example: "Hello, I'm interested in your service listing.",
                        maxLength: 5000
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Message sent successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "message",
                            type: "object",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 1),
                                new OA\Property(property: "conversation_id", type: "integer", example: 1),
                                new OA\Property(property: "sender_id", type: "integer", example: 1),
                                new OA\Property(
                                    property: "sender",
                                    type: "object",
                                    properties: [
                                        new OA\Property(property: "id", type: "integer", example: 1),
                                        new OA\Property(property: "name", type: "string", example: "John Doe"),
                                        new OA\Property(property: "photo", type: "string", nullable: true),
                                    ]
                                ),
                                new OA\Property(property: "message", type: "string", example: "Hello, I'm interested in your service listing."),
                                new OA\Property(property: "is_read", type: "boolean", example: false),
                                new OA\Property(property: "created_at", type: "string", format: "date-time", example: "2024-01-15T10:30:00Z"),
                            ]
                        ),
                        new OA\Property(
                            property: "conversation",
                            type: "object",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 1),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 403,
                description: "Forbidden - Helper/Business can only reply to users who have contacted them first",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "You can only reply to users who have contacted you first."),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "Validation error",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "The given data was invalid."),
                        new OA\Property(
                            property: "errors",
                            type: "object",
                            properties: [
                                new OA\Property(property: "recipient_id", type: "array", items: new OA\Items(type: "string")),
                                new OA\Property(property: "message", type: "array", items: new OA\Items(type: "string")),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
        ]
    )]
    public function sendMessage(Request $request): JsonResponse
    {
        $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'message' => 'required|string|max:5000',
        ]);

        $user = Auth::user();
        $recipientId = $request->recipient_id;

        if ($user->id === $recipientId) {
            return response()->json(['message' => 'Cannot send message to yourself'], 422);
        }

        // Get recipient user to check their role
        $recipient = \App\Models\User::findOrFail($recipientId);
        
        // Check if sender is helper/business and recipient is a regular user
        $senderIsHelperOrBusiness = $user->hasRole(['helper', 'business']);
        $recipientIsUser = $recipient->hasRole('user');
        
        // Get or create conversation
        $conversation = Conversation::getOrCreate($user->id, $recipientId);
        
        // If helper/business is trying to contact a user, check if user has already initiated
        if ($senderIsHelperOrBusiness && $recipientIsUser) {
            // Check if user has sent any messages in this conversation
            $userHasMessaged = $conversation->messages()
                ->where('sender_id', $recipientId)
                ->exists();
            
            if (!$userHasMessaged) {
                return response()->json([
                    'message' => 'You can only reply to users who have contacted you first.'
                ], 403);
            }
        }

        // Create message
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'message' => $request->message,
        ]);

        // Update conversation's last message time
        $conversation->update(['last_message_at' => now()]);

        // Load relationships before broadcasting
        $message->load('sender.profile');
        $message->refresh();

        // Broadcast message via Pusher
        event(new MessageSent($message, $conversation));

        // Send notification to recipient (only if they're not the sender)
        if ($recipientId !== $user->id) {
            $message->load(['sender', 'conversation']);
            $recipient->notify(new NewMessage($message));
        }

        return response()->json([
            'message' => [
                'id' => $message->id,
                'conversation_id' => $message->conversation_id,
                'sender_id' => $message->sender_id,
                'sender' => [
                    'id' => $message->sender->id,
                    'name' => $message->sender->name,
                    'photo' => $message->sender->photo,
                ],
                'message' => $message->message,
                'is_read' => $message->is_read,
                'created_at' => $message->created_at->toIso8601String(),
            ],
            'conversation' => [
                'id' => $conversation->id,
            ],
        ], 201);
    }
    #[OA\Delete(
        path: "/api/messages/{message}",
        summary: "Delete a message",
        description: "Delete a specific message. Only the sender can delete their message.",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "message",
                in: "path",
                required: true,
                description: "Message ID",
                schema: new OA\Schema(type: "integer")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Message deleted successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Message deleted successfully"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Unauthorized - Only sender can delete"),
            new OA\Response(response: 404, description: "Message not found"),
            new OA\Response(response: 401, description: "Unauthenticated"),
        ]
    )]
    public function deleteMessage(Message $message): JsonResponse
    {
        if ($message->sender_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $message->delete();

        return response()->json(['message' => 'Message deleted successfully']);
    }

    #[OA\Delete(
        path: "/api/conversations/{conversation}",
        summary: "Delete a conversation for current user",
        description: "Delete a conversation for the current user only. The other participant will still see the conversation. If the other participant sends a new message, this user will see the conversation again with only messages from the deletion time onwards.",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "conversation",
                in: "path",
                required: true,
                description: "Conversation ID",
                schema: new OA\Schema(type: "integer")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Conversation deleted for current user",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Conversation deleted successfully"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Unauthorized - Not a participant"),
            new OA\Response(response: 404, description: "Conversation not found"),
            new OA\Response(response: 401, description: "Unauthenticated"),
        ]
    )]
    public function deleteConversation(Conversation $conversation): JsonResponse
    {
        $user = Auth::user();
        
        if ($conversation->user_one_id !== $user->id && $conversation->user_two_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Mark conversation as deleted for this user only (soft delete per participant)
        $conversation->markAsDeletedForUser($user->id);

        return response()->json(['message' => 'Conversation deleted successfully']);
    }
}

