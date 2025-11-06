<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\User;
use App\Models\Review;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function dashboard()
    {
        $stats = [
            'total_users' => User::count(),
            'total_helpers' => User::role('helper')->count(),
            'verified_helpers' => User::role('helper')->where('verification_status', 'verified')->count(),
            'pending_helpers' => User::role('helper')->where('verification_status', 'pending')->count(),
            'total_bookings' => Booking::count(),
            'pending_bookings' => Booking::where('status', 'pending')->count(),
            'confirmed_bookings' => Booking::where('status', 'confirmed')->count(),
            'total_reviews' => Review::count(),
            'pending_documents' => Document::where('status', 'pending')->count(),
        ];

        $recentBookings = Booking::with(['user', 'assignedUser'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        $pendingHelpers = User::role('helper')
            ->where('verification_status', 'pending')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'stats' => $stats,
            'recent_bookings' => $recentBookings,
            'pending_helpers' => $pendingHelpers,
        ]);
    }

    public function helpers(Request $request)
    {
        $query = User::role('helper');

        if ($request->has('status')) {
            $query->where('verification_status', $request->status);
        }

        $helpers = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'helpers' => $helpers,
            'filters' => $request->only(['status']),
        ]);
    }

    public function updateHelperStatus(Request $request, User $helper)
    {
        if (!$helper->hasRole('helper')) {
            abort(404);
        }

        $validated = $request->validate([
            'verification_status' => 'required|in:pending,verified,rejected',
            'is_active' => 'boolean',
        ]);

        $helper->update($validated);

        return response()->json([
            'message' => 'Helper status updated successfully!',
            'helper' => $helper->load('roles'),
        ]);
    }

    public function bookings(Request $request)
    {
        $query = Booking::with(['user', 'assignedUser']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $bookings = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'bookings' => $bookings,
            'filters' => $request->only(['status']),
        ]);
    }

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

    public function updateDocumentStatus(Request $request, Document $document)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,verified,rejected',
            'admin_notes' => 'nullable|string',
        ]);

        $document->update($validated);

        // If all documents are verified, mark helper as verified
        if ($validated['status'] === 'verified') {
            $helper = $document->helper;
            if ($helper) {
                $allVerified = $helper->documents()
                    ->where('status', '!=', 'verified')
                    ->count() === 0;

                if ($allVerified && $helper->documents()->where('status', 'verified')->count() > 0) {
                    $helper->update(['verification_status' => 'verified']);
                }
            }
        }

        return response()->json([
            'message' => 'Document status updated successfully!',
            'document' => $document->load('helper'),
        ]);
    }
}
