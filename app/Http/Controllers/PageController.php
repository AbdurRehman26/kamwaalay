<?php

namespace App\Http\Controllers;

use App\Models\City;
use App\Models\ServiceType;
use App\Models\Language;
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
        path: "/api/service-types",
        summary: "Get service types",
        description: "Get a list of all active service types",
        tags: ["Pages"],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of service types",
                content: new OA\JsonContent(
                    type: "array",
                    items: new OA\Items(
                        type: "object",
                        properties: [
                            new OA\Property(property: "id", type: "integer"),
                            new OA\Property(property: "slug", type: "string"),
                            new OA\Property(property: "name", type: "string"),
                            new OA\Property(property: "icon", type: "string", nullable: true),
                            new OA\Property(property: "sort_order", type: "integer"),
                        ]
                    )
                )
            ),
        ]
    )]
    /**
     * Get all active service types
     */
    public function serviceTypes(): JsonResponse
    {
        $serviceTypes = ServiceType::active()->get([
            'id',
            'slug',
            'name',
            'icon',
            'sort_order',
        ]);

        return response()->json($serviceTypes);
    }

    #[OA\Get(
        path: "/api/languages",
        summary: "Get languages",
        description: "Get a list of all active languages",
        tags: ["Pages"],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of languages",
                content: new OA\JsonContent(
                    type: "array",
                    items: new OA\Items(
                        type: "object",
                        properties: [
                            new OA\Property(property: "id", type: "integer"),
                            new OA\Property(property: "name", type: "string"),
                            new OA\Property(property: "code", type: "string"),
                            new OA\Property(property: "sort_order", type: "integer"),
                        ]
                    )
                )
            ),
        ]
    )]
    /**
     * Get all active languages
     */
    public function languages(): JsonResponse
    {
        $languages = Language::active()->get([
            'id',
            'name',
            'code',
            'sort_order',
        ]);

        return response()->json($languages);
    }

    #[OA\Get(
        path: "/api/cities",
        summary: "Get cities",
        description: "Get a list of all active cities",
        tags: ["Pages"],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of cities",
                content: new OA\JsonContent(
                    type: "array",
                    items: new OA\Items(
                        type: "object",
                        properties: [
                            new OA\Property(property: "id", type: "integer"),
                            new OA\Property(property: "name", type: "string"),
                            new OA\Property(property: "code", type: "string"),
                        ]
                    )
                )
            ),
        ]
    )]
    /**
     * Get all active cities
     */
    public function cities(): JsonResponse
    {
        $cities = City::where('is_active', true)
            ->get()
            ->map(function ($city) {
                return [
                    'id' => $city->id,
                    'name' => $city->name,
                    'code' => $city->state,
                ];
            });

        return response()->json($cities);
    }
}
