<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Messages", description: "Chat messaging endpoints")]
class MessageController extends Controller
{
    #[OA\Get(
        path: "/api/conversations",
        summary: "Get user's conversations",
        description: "Get list of all conversations for the authenticated user",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of conversations",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "conversations", type: "array", items: new OA\Items(type: "object")),
                    ]
                )
            ),
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
        description: "Get paginated messages for a specific conversation",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "conversation", in: "path", required: true, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "page", in: "query", required: false, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Paginated messages",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "messages", type: "object", description: "Paginated messages"),
                    ]
                )
            ),
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
        description: "Send a message to a user (creates conversation if it doesn't exist)",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["recipient_id", "message"],
                properties: [
                    new OA\Property(property: "recipient_id", type: "integer", description: "ID of the recipient user"),
                    new OA\Property(property: "message", type: "string", description: "Message content"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Message sent successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "object", description: "Created message"),
                        new OA\Property(property: "conversation", type: "object", description: "Conversation object"),
                    ]
                )
            ),
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

