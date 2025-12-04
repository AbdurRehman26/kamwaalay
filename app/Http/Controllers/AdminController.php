<?php

namespace App\Http\Controllers;

use App\Models\JobPost;
use App\Models\User;
use App\Models\Review;
use App\Models\Document;
use App\Notifications\DocumentVerified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Admin", description: "Admin management endpoints")]
class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware(function ($request, $next) {
            if (!auth()->user()->isAdmin()) {
                abort(403);
            }
            return $next($request);
        });
    }

    #[OA\Get(
        path: "/api/admin/dashboard",
        summary: "Get admin dashboard",
        description: "Get admin dashboard statistics and recent activity. Requires admin role.",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Admin dashboard data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "stats", type: "object", description: "Platform statistics"),
                        new OA\Property(property: "recent_bookings", type: "array", items: new OA\Items(type: "object")),
                        new OA\Property(property: "pending_helpers", type: "array", items: new OA\Items(type: "object")),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Admin access required"),
        ]
    )]
    public function dashboard()
    {
        $stats = [
            'total_users' => User::count(),
            'total_helpers' => User::role('helper')->count(),
            'verified_helpers' => User::role('helper')->whereHas('profile', function ($q) {
                $q->where('verification_status', 'verified');
            })->count(),
            'pending_helpers' => User::role('helper')->whereHas('profile', function ($q) {
                $q->where('verification_status', 'pending');
            })->count(),
            'total_bookings' => JobPost::count(),
            'pending_bookings' => JobPost::where('status', 'pending')->count(),
            'confirmed_bookings' => JobPost::where('status', 'confirmed')->count(),
            'total_reviews' => Review::count(),
            'pending_documents' => Document::where('status', 'pending')->count(),
        ];

        $recentBookings = JobPost::with(['user', 'assignedUser'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        $pendingHelpers = User::role('helper')
            ->whereHas('profile', function ($q) {
                $q->where('verification_status', 'pending');
            })
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'stats' => $stats,
            'recent_bookings' => $recentBookings,
            'pending_helpers' => $pendingHelpers,
        ]);
    }

    #[OA\Get(
        path: "/api/admin/helpers",
        summary: "List helpers (admin)",
        description: "Get paginated list of helpers with optional status filter. Requires admin role.",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "status", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["pending", "verified", "rejected"])),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of helpers",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "helpers", type: "object", description: "Paginated list of helpers"),
                        new OA\Property(property: "filters", type: "object", description: "Applied filters"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Admin access required"),
        ]
    )]
    public function helpers(Request $request)
    {
        $query = User::role('helper');

        if ($request->has('status')) {
            $query->whereHas('profile', function ($q) use ($request) {
                $q->where('verification_status', $request->status);
            });
        }

        $helpers = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'helpers' => $helpers,
            'filters' => $request->only(['status']),
        ]);
    }

    #[OA\Patch(
        path: "/api/admin/helpers/{helper}/status",
        summary: "Update helper status",
        description: "Update helper verification status and active status. Requires admin role.",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "helper", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Helper user ID"),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["verification_status"],
                properties: [
                    new OA\Property(property: "verification_status", type: "string", enum: ["pending", "verified", "rejected"]),
                    new OA\Property(property: "is_active", type: "boolean", nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Helper status updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Helper status updated successfully!"),
                        new OA\Property(property: "helper", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Admin access required"),
            new OA\Response(response: 404, description: "Helper not found"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function updateHelperStatus(Request $request, User $helper)
    {
        if (!$helper->hasRole('helper')) {
            abort(404);
        }

        $validated = $request->validate([
            'verification_status' => 'required|in:pending,verified,rejected',
            'is_active' => 'boolean',
        ]);

        // Update or create profile
        $helper->profile()->updateOrCreate(
            ['profileable_id' => $helper->id, 'profileable_type' => 'App\Models\User'],
            $validated
        );

        return response()->json([
            'message' => 'Helper status updated successfully!',
            'helper' => $helper->load(['roles', 'profile']),
        ]);
    }

    #[OA\Get(
        path: "/api/admin/bookings",
        summary: "List bookings (admin)",
        description: "Get paginated list of all bookings with optional status filter. Requires admin role.",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "status", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"])),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of bookings",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "bookings", type: "object", description: "Paginated list of bookings"),
                        new OA\Property(property: "filters", type: "object", description: "Applied filters"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Admin access required"),
        ]
    )]
    public function bookings(Request $request)
    {
        $query = JobPost::with(['user', 'assignedUser']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $bookings = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'bookings' => $bookings,
            'filters' => $request->only(['status']),
        ]);
    }

    #[OA\Get(
        path: "/api/admin/documents",
        summary: "List documents (admin)",
        description: "Get paginated list of all documents with optional status filter. Requires admin role.",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "status", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["pending", "verified", "rejected"])),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of documents",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "documents", type: "object", description: "Paginated list of documents"),
                        new OA\Property(property: "filters", type: "object", description: "Applied filters"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Admin access required"),
        ]
    )]
    public function documents(Request $request)
    {
        $query = Document::with(['helper']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $documents = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'documents' => $documents,
            'filters' => $request->only(['status']),
        ]);
    }

    #[OA\Patch(
        path: "/api/admin/documents/{document}/status",
        summary: "Update document status",
        description: "Update document verification status. Requires admin role. If all documents are verified, helper is automatically verified.",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "document", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Document ID"),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["status"],
                properties: [
                    new OA\Property(property: "status", type: "string", enum: ["pending", "verified", "rejected"]),
                    new OA\Property(property: "admin_notes", type: "string", nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Document status updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Document status updated successfully!"),
                        new OA\Property(property: "document", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Admin access required"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function updateDocumentStatus(Request $request, Document $document)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,verified,rejected',
            'admin_notes' => 'nullable|string',
        ]);

        $oldStatus = $document->status;
        $document->update($validated);
        $document->refresh();

        // If all documents are verified, mark helper as verified
        if ($validated['status'] === 'verified') {
            $helper = $document->helper;
            if ($helper) {
                $allVerified = $helper->documents()
                    ->where('status', '!=', 'verified')
                    ->count() === 0;

                if ($allVerified && $helper->documents()->where('status', 'verified')->count() > 0) {
                    $helper->profile()->updateOrCreate(
                        ['profileable_id' => $helper->id, 'profileable_type' => 'App\Models\User'],
                        ['verification_status' => 'verified']
                    );
                }
            }
        }

        // Notify user about document status change (if status changed)
        if ($oldStatus !== $validated['status'] && ($validated['status'] === 'verified' || $validated['status'] === 'rejected')) {
            $document->user->notify(new DocumentVerified($document, $validated['status']));
        }

        return response()->json([
            'message' => 'Document status updated successfully!',
            'document' => $document->load('helper'),
        ]);
    }
}
