<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Notifications", description: "User notification management endpoints")]
class NotificationController extends Controller
{
    #[OA\Get(
        path: "/api/notifications",
        summary: "Get user notifications",
        description: "Get paginated list of notifications for the authenticated user. Notifications include job applications, messages, and document verification updates.",
        tags: ["Notifications"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "page", in: "query", required: false, schema: new OA\Schema(type: "integer", example: 1), description: "Page number for pagination"),
            new OA\Parameter(name: "per_page", in: "query", required: false, schema: new OA\Schema(type: "integer", example: 15), description: "Number of notifications per page"),
            new OA\Parameter(name: "unread_only", in: "query", required: false, schema: new OA\Schema(type: "boolean", example: false), description: "Return only unread notifications"),
            new OA\Parameter(
                name: "type",
                in: "query",
                required: false,
                schema: new OA\Schema(
                    type: "string",
                    enum: ["job_application_received", "job_application_status_changed", "new_message", "document_verified"]
                ),
                description: "Filter by notification type"
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Paginated list of notifications",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "notifications",
                            type: "object",
                            properties: [
                                new OA\Property(property: "current_page", type: "integer", example: 1),
                                new OA\Property(property: "data", type: "array", items: new OA\Items(
                                    type: "object",
                                    properties: [
                                        new OA\Property(property: "id", type: "string", example: "550e8400-e29b-41d4-a716-446655440000"),
                                        new OA\Property(property: "type", type: "string", enum: ["job_application_received", "job_application_status_changed", "new_message", "document_verified"], example: "job_application_received"),
                                        new OA\Property(property: "notifiable_type", type: "string", example: "App\\Models\\User"),
                                        new OA\Property(property: "notifiable_id", type: "integer", example: 1),
                                        new OA\Property(
                                            property: "data",
                                            type: "object",
                                            description: "Notification data (varies by type). Contains type-specific information.",
                                            properties: [
                                                new OA\Property(property: "type", type: "string", enum: ["job_application_received", "job_application_status_changed", "new_message", "document_verified"], example: "job_application_received", description: "Notification type"),
                                                new OA\Property(property: "title", type: "string", example: "New Job Application Received", description: "Notification title"),
                                                new OA\Property(property: "message", type: "string", example: "John Doe has applied for your Maid service request.", description: "Notification message"),
                                                // Job Application Received fields
                                                new OA\Property(property: "application_id", type: "integer", nullable: true, example: 1, description: "Job application ID (for job_application_received type)"),
                                                new OA\Property(property: "booking_id", type: "integer", nullable: true, example: 1, description: "Booking ID (for job_application_received type)"),
                                                new OA\Property(property: "applicant_id", type: "integer", nullable: true, example: 5, description: "Applicant user ID (for job_application_received type)"),
                                                new OA\Property(property: "applicant_name", type: "string", nullable: true, example: "John Doe", description: "Applicant name (for job_application_received type)"),
                                                new OA\Property(property: "service_type", type: "string", nullable: true, example: "maid", description: "Service type (for job_application_received type)"),
                                                new OA\Property(property: "service_type_label", type: "string", nullable: true, example: "Maid", description: "Service type label (for job_application_received type)"),
                                                // Job Application Status Changed fields
                                                new OA\Property(property: "old_status", type: "string", nullable: true, example: "pending", description: "Previous status (for job_application_status_changed type)"),
                                                new OA\Property(property: "new_status", type: "string", nullable: true, example: "accepted", description: "New status (for job_application_status_changed type)"),
                                                new OA\Property(property: "booking_owner_name", type: "string", nullable: true, example: "Jane Smith", description: "Booking owner name (for job_application_status_changed type)"),
                                                // New Message fields
                                                new OA\Property(property: "message_id", type: "integer", nullable: true, example: 10, description: "Message ID (for new_message type)"),
                                                new OA\Property(property: "conversation_id", type: "integer", nullable: true, example: 3, description: "Conversation ID (for new_message type)"),
                                                new OA\Property(property: "sender_id", type: "integer", nullable: true, example: 5, description: "Sender user ID (for new_message type)"),
                                                new OA\Property(property: "sender_name", type: "string", nullable: true, example: "John Doe", description: "Sender name (for new_message type)"),
                                                new OA\Property(property: "message_preview", type: "string", nullable: true, example: "Hello, I'm interested in your service...", description: "Message preview (for new_message type)"),
                                                // Document Verified fields
                                                new OA\Property(property: "document_id", type: "integer", nullable: true, example: 2, description: "Document ID (for document_verified type)"),
                                                new OA\Property(property: "document_type", type: "string", nullable: true, example: "nic", description: "Document type (for document_verified type)"),
                                                new OA\Property(property: "document_type_label", type: "string", nullable: true, example: "NIC", description: "Document type label (for document_verified type)"),
                                                new OA\Property(property: "status", type: "string", nullable: true, example: "verified", description: "Document verification status (for document_verified type)"),
                                                new OA\Property(property: "admin_notes", type: "string", nullable: true, example: "Document verified successfully", description: "Admin notes (for document_verified type)"),
                                            ]
                                        ),
                                        new OA\Property(property: "read_at", type: "string", nullable: true, example: "2025-11-27T10:30:00.000000Z"),
                                        new OA\Property(property: "created_at", type: "string", example: "2025-11-27T10:00:00.000000Z"),
                                        new OA\Property(property: "updated_at", type: "string", example: "2025-11-27T10:00:00.000000Z"),
                                    ]
                                )),
                                new OA\Property(property: "first_page_url", type: "string", example: "http://kamwaalay.test/api/notifications?page=1"),
                                new OA\Property(property: "from", type: "integer", example: 1),
                                new OA\Property(property: "last_page", type: "integer", example: 5),
                                new OA\Property(property: "last_page_url", type: "string", example: "http://kamwaalay.test/api/notifications?page=5"),
                                new OA\Property(property: "links", type: "array", items: new OA\Items(type: "object")),
                                new OA\Property(property: "next_page_url", type: "string", nullable: true),
                                new OA\Property(property: "path", type: "string", example: "http://kamwaalay.test/api/notifications"),
                                new OA\Property(property: "per_page", type: "integer", example: 15),
                                new OA\Property(property: "prev_page_url", type: "string", nullable: true),
                                new OA\Property(property: "to", type: "integer", example: 15),
                                new OA\Property(property: "total", type: "integer", example: 75),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
        ]
    )]
    /**
     * Get user's notifications
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 15);
        $unreadOnly = $request->boolean('unread_only', false);
        $type = $request->get('type'); // Filter by notification type
        
        $query = $user->notifications();
        
        // Filter by read status
        if ($unreadOnly) {
            $query->whereNull('read_at');
        }
        
        // Filter by notification type
        if ($type) {
            $query->whereJsonContains('data->type', $type);
        }
        
        $notifications = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'notifications' => $notifications,
        ]);
    }

    #[OA\Get(
        path: "/api/notifications/all",
        summary: "Get all notifications",
        description: "Get all notifications for the authenticated user without pagination. Supports filtering by read status and notification type.",
        tags: ["Notifications"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "unread_only",
                in: "query",
                required: false,
                schema: new OA\Schema(type: "boolean", example: false),
                description: "Return only unread notifications"
            ),
            new OA\Parameter(
                name: "type",
                in: "query",
                required: false,
                schema: new OA\Schema(
                    type: "string",
                    enum: ["job_application_received", "job_application_status_changed", "new_message", "document_verified"]
                ),
                description: "Filter by notification type"
            ),
            new OA\Parameter(
                name: "limit",
                in: "query",
                required: false,
                schema: new OA\Schema(type: "integer", example: 100),
                description: "Maximum number of notifications to return (default: no limit)"
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of all notifications",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "notifications",
                            type: "array",
                            items: new OA\Items(
                                type: "object",
                                properties: [
                                    new OA\Property(property: "id", type: "string", example: "550e8400-e29b-41d4-a716-446655440000"),
                                    new OA\Property(property: "type", type: "string", enum: ["job_application_received", "job_application_status_changed", "new_message", "document_verified"], example: "job_application_received"),
                                    new OA\Property(property: "notifiable_type", type: "string", example: "App\\Models\\User"),
                                    new OA\Property(property: "notifiable_id", type: "integer", example: 1),
                                    new OA\Property(property: "data", type: "object", description: "Notification data"),
                                    new OA\Property(property: "read_at", type: "string", nullable: true, example: "2025-11-27T10:30:00.000000Z"),
                                    new OA\Property(property: "created_at", type: "string", example: "2025-11-27T10:00:00.000000Z"),
                                    new OA\Property(property: "updated_at", type: "string", example: "2025-11-27T10:00:00.000000Z"),
                                ]
                            )
                        ),
                        new OA\Property(property: "total", type: "integer", example: 50, description: "Total number of notifications returned"),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
        ]
    )]
    /**
     * Get all user's notifications (non-paginated)
     */
    public function all(Request $request): JsonResponse
    {
        $user = $request->user();
        $unreadOnly = $request->boolean('unread_only', false);
        $type = $request->get('type');
        $limit = $request->get('limit');
        
        $query = $user->notifications();
        
        // Filter by read status
        if ($unreadOnly) {
            $query->whereNull('read_at');
        }
        
        // Filter by notification type
        if ($type) {
            $query->whereJsonContains('data->type', $type);
        }
        
        $query->orderBy('created_at', 'desc');
        
        if ($limit) {
            $notifications = $query->limit($limit)->get();
        } else {
            $notifications = $query->get();
        }

        return response()->json([
            'notifications' => $notifications,
            'total' => $notifications->count(),
        ]);
    }

    #[OA\Get(
        path: "/api/notifications/unread-count",
        summary: "Get unread notifications count",
        description: "Get count of unread notifications for the authenticated user. Useful for displaying notification badges.",
        tags: ["Notifications"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Unread notifications count",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "unread_count", type: "integer", example: 5, description: "Number of unread notifications"),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
        ]
    )]
    /**
     * Get unread notifications count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $unreadCount = $user->unreadNotifications()->count();

        return response()->json([
            'unread_count' => $unreadCount,
        ]);
    }

    #[OA\Post(
        path: "/api/notifications/{notification}/read",
        summary: "Mark notification as read",
        description: "Mark a specific notification as read. The notification must belong to the authenticated user.",
        tags: ["Notifications"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "notification",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "string"),
                description: "Notification ID (UUID)",
                example: "550e8400-e29b-41d4-a716-446655440000"
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Notification marked as read successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Notification marked as read."),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 404, description: "Notification not found or does not belong to user"),
        ]
    )]
    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, string $notification): JsonResponse
    {
        $user = $request->user();
        $notification = $user->notifications()->find($notification);
        
        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json([
            'message' => 'Notification marked as read.',
        ]);
    }

    #[OA\Post(
        path: "/api/notifications/mark-all-read",
        summary: "Mark all notifications as read",
        description: "Mark all unread notifications as read for the authenticated user. This is useful for clearing all notification badges at once.",
        tags: ["Notifications"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "All notifications marked as read successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "All notifications marked as read."),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
        ]
    )]
    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->unreadNotifications->markAsRead();

        return response()->json([
            'message' => 'All notifications marked as read.',
        ]);
    }

    #[OA\Post(
        path: "/api/notifications/bulk-read",
        summary: "Mark multiple notifications as read",
        description: "Mark multiple notifications as read by providing their IDs. All notifications must belong to the authenticated user.",
        tags: ["Notifications"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["notification_ids"],
                properties: [
                    new OA\Property(
                        property: "notification_ids",
                        type: "array",
                        items: new OA\Items(type: "string"),
                        example: ["550e8400-e29b-41d4-a716-446655440000", "660e8400-e29b-41d4-a716-446655440001"],
                        description: "Array of notification IDs to mark as read"
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Notifications marked as read successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "3 notifications marked as read."),
                        new OA\Property(property: "marked_count", type: "integer", example: 3, description: "Number of notifications successfully marked as read"),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(
                response: 422,
                description: "Validation error",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "The notification ids field is required."),
                        new OA\Property(property: "errors", type: "object"),
                    ]
                )
            ),
        ]
    )]
    /**
     * Mark multiple notifications as read
     */
    public function bulkMarkAsRead(Request $request): JsonResponse
    {
        $request->validate([
            'notification_ids' => ['required', 'array', 'min:1'],
            'notification_ids.*' => ['required', 'string'],
        ]);

        $user = $request->user();
        $notificationIds = $request->input('notification_ids');
        
        // Get notifications that belong to the user
        $notifications = $user->notifications()->whereIn('id', $notificationIds)->get();
        
        $markedCount = 0;
        foreach ($notifications as $notification) {
            if (!$notification->read_at) {
                $notification->markAsRead();
                $markedCount++;
            }
        }

        return response()->json([
            'message' => "{$markedCount} notification" . ($markedCount !== 1 ? 's' : '') . " marked as read.",
            'marked_count' => $markedCount,
        ]);
    }
}
