<?php

namespace App\Http\Controllers;

use App\Models\City;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Pages", description: "Public page endpoints")]
class PageController extends Controller
{
    #[OA\Get(
        path: "/api/about",
        summary: "Get about page",
        description: "Get about page content",
        tags: ["Pages"],
        responses: [
            new OA\Response(
                response: 200,
                description: "About page content",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "About page content"),
                    ]
                )
            ),
        ]
    )]
    public function about(): JsonResponse
    {
        return response()->json(['message' => 'About page content']);
    }

    #[OA\Get(
        path: "/api/contact",
        summary: "Get contact page",
        description: "Get contact page content",
        tags: ["Pages"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Contact page content",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Contact page content"),
                    ]
                )
            ),
        ]
    )]
    public function contact(): JsonResponse
    {
        return response()->json(['message' => 'Contact page content']);
    }

    #[OA\Post(
        path: "/api/contact",
        summary: "Send contact form message",
        description: "Submit a contact form message",
        tags: ["Pages"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["name", "message"],
                properties: [
                    new OA\Property(property: "name", type: "string", description: "Contact name"),
                    new OA\Property(property: "phone", type: "string", nullable: true, description: "Contact phone number"),
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
                        new OA\Property(property: "message", type: "string", example: "Thank you for contacting us. We'll get back to you soon."),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "Validation error",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "errors", type: "object"),
                    ]
                )
            ),
        ]
    )]
    public function sendContactMessage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'message' => 'required|string|max:5000',
        ]);

        // In a real application, you would:
        // 1. Store the message in a database
        // 2. Send an email notification
        // 3. Send a confirmation email to the user

        // For now, we'll just log it and return success
        \Log::info('Contact form submission', $validated);

        return response()->json([
            'message' => 'Thank you for contacting us. We\'ll get back to you soon.',
        ], 200);
    }

    #[OA\Get(
        path: "/api/faq",
        summary: "Get FAQ page",
        description: "Get FAQ page content",
        tags: ["Pages"],
        responses: [
            new OA\Response(
                response: 200,
                description: "FAQ page content",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "FAQ page content"),
                    ]
                )
            ),
        ]
    )]
    public function faq(): JsonResponse
    {
        return response()->json(['message' => 'FAQ page content']);
    }

    #[OA\Get(
        path: "/api/terms",
        summary: "Get terms page",
        description: "Get terms and conditions page content",
        tags: ["Pages"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Terms page content",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Terms page content"),
                    ]
                )
            ),
        ]
    )]
    public function terms(): JsonResponse
    {
        return response()->json(['message' => 'Terms page content']);
    }

    #[OA\Get(
        path: "/api/privacy",
        summary: "Get privacy page",
        description: "Get privacy policy page content",
        tags: ["Pages"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Privacy page content",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Privacy page content"),
                    ]
                )
            ),
        ]
    )]
    public function privacy(): JsonResponse
    {
        return response()->json(['message' => 'Privacy page content']);
    }

    #[OA\Get(
        path: "/api/karachi-locations/search",
        summary: "Search Karachi locations",
        description: "Search Karachi locations for autocomplete (deprecated - use /api/locations/search)",
        tags: ["Pages"],
        parameters: [
            new OA\Parameter(name: "q", in: "query", required: false, schema: new OA\Schema(type: "string"), description: "Search query"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of matching location areas",
                content: new OA\JsonContent(
                    type: "array",
                    items: new OA\Items(type: "string")
                )
            ),
        ]
    )]
    /**
     * Search Karachi locations for autocomplete (deprecated - use searchLocations)
     */
    public function searchKarachiLocations(Request $request)
    {
        $query = $request->get('q', '');

        $karachi = City::where('name', 'Karachi')->first();

        if (!$karachi) {
            return response()->json([]);
        }

        $locations = Location::where('city_id', $karachi->id)
            ->where('area', 'like', '%' . $query . '%')
            ->where('is_active', true)
            ->orderBy('area')
            ->limit(10)
            ->pluck('area')
            ->unique()
            ->values();

        return response()->json($locations);
    }

    #[OA\Get(
        path: "/api/locations/search",
        summary: "Search locations",
        description: "Search locations (cities and areas) for autocomplete",
        tags: ["Pages"],
        parameters: [
            new OA\Parameter(name: "q", in: "query", required: false, schema: new OA\Schema(type: "string", minLength: 2), description: "Search query (minimum 2 characters)"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of matching locations",
                content: new OA\JsonContent(
                    type: "array",
                    items: new OA\Items(
                        type: "object",
                        properties: [
                            new OA\Property(property: "id", type: "integer"),
                            new OA\Property(property: "city_id", type: "integer"),
                            new OA\Property(property: "city_name", type: "string"),
                            new OA\Property(property: "area", type: "string", nullable: true),
                            new OA\Property(property: "display_text", type: "string"),
                            new OA\Property(property: "latitude", type: "number", nullable: true),
                            new OA\Property(property: "longitude", type: "number", nullable: true),
                        ]
                    )
                )
            ),
        ]
    )]
    /**
     * Search locations for autocomplete (city and area)
     */
    public function searchLocations(Request $request)
    {
        $query = $request->get('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $results = collect();

        // Search locations by area
        $locations = Location::with('city')
            ->where('area', 'like', '%' . $query . '%')
            ->where('is_active', true)
            ->limit(15)
            ->get()
            ->map(function ($location) {
                $displayText = $location->area;

                return [
                    'id' => $location->id,
                    'city_id' => $location->city_id,
                    'city_name' => $location->city->name,
                    'area' => $location->area,
                    'display_text' => $displayText,
                    'latitude' => $location->latitude,
                    'longitude' => $location->longitude,
                ];
            });

        $results = $results->concat($locations);

        // Also search cities by name
        $cities = City::where('name', 'like', '%' . $query . '%')
            ->where('is_active', true)
            ->limit(10)
            ->get()
            ->map(function ($city) {
                return [
                    'id' => null,
                    'city_id' => $city->id,
                    'city_name' => $city->name,
                    'area' => null,
                    'display_text' => $city->name,
                    'latitude' => null,
                    'longitude' => null,
                ];
            });

        $results = $results->concat($cities);

        // Deduplicate and limit results
        $results = $results->unique('display_text')->take(20)->values();

        return response()->json($results);
    }
}
