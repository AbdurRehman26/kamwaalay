<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
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
        
        $conversations = Conversation::where('user_one_id', $user->id)
            ->orWhere('user_two_id', $user->id)
            ->with(['userOne', 'userTwo', 'messages' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->orderBy('last_message_at', 'desc')
            ->get()
            ->map(function ($conversation) use ($user) {
                $otherUser = $conversation->getOtherUser($user->id);
                $lastMessage = $conversation->messages->first();
                
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
                    'unread_count' => $conversation->messages()
                        ->where('sender_id', '!=', $user->id)
                        ->where('is_read', false)
                        ->count(),
                    'updated_at' => $conversation->updated_at->toIso8601String(),
                ];
            });

        return response()->json([
            'conversations' => $conversations,
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

        $messages = $conversation->messages()
            ->with('sender:id,name,photo')
            ->orderBy('created_at', 'desc')
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
        description: "Send a message to a user. Creates a new conversation if one doesn't exist. The message is broadcast via Pusher to the recipient in real-time.",
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

        // Get or create conversation
        $conversation = Conversation::getOrCreate($user->id, $recipientId);

        // Create message
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'message' => $request->message,
        ]);

        // Update conversation's last message time
        $conversation->update(['last_message_at' => now()]);

        // Load relationships before broadcasting
        $message->load('sender:id,name,photo');
        $message->refresh();

        // Broadcast message via Pusher
        event(new MessageSent($message, $conversation));

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
}

