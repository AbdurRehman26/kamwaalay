<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class HomeController extends Controller
{
    public function index(): JsonResponse
    {
        $featuredHelpers = User::verifiedHelpers()
            ->with('roles')
            ->orderBy('rating', 'desc')
            ->take(6)
            ->get();

        $stats = [
            'total_helpers' => User::verifiedHelpers()->count(),
            'total_bookings' => \App\Models\Booking::where('status', 'confirmed')->count(),
            'total_reviews' => \App\Models\Review::count(),
            'verified_helpers' => User::role('helper')->where('verification_status', 'verified')->count(),
        ];

        return response()->json([
            'featured_helpers' => $featuredHelpers,
            'stats' => $stats,
        ]);
    }
}
