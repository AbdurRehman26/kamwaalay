<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Pages", description: "Public page endpoints")]
class HomeController extends Controller
{
    #[OA\Get(
        path: "/api/home",
        summary: "Get home page data",
        description: "Get home page data including featured helpers and platform statistics",
        tags: ["Pages"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Home page data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "featured_helpers", type: "array", items: new OA\Items(type: "object"), description: "List of featured verified helpers"),
                        new OA\Property(property: "stats", type: "object", description: "Platform statistics"),
                    ]
                )
            ),
        ]
    )]
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
            'featured_helpers' => UserResource::collection($featuredHelpers),
            'stats' => $stats,
        ]);
    }
}
