<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\App;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Language", description: "Language and translation endpoints")]
class LanguageController extends Controller
{
    #[OA\Post(
        path: "/api/locale/{locale}",
        summary: "Switch application language",
        description: "Changes the application language to the specified locale",
        tags: ["Language"],
        parameters: [
            new OA\Parameter(
                name: "locale",
                in: "path",
                required: true,
                description: "Language locale code (en or ur)",
                schema: new OA\Schema(type: "string", enum: ["en", "ur"])
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Language changed successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Language changed successfully."),
                        new OA\Property(property: "locale", type: "string", example: "en"),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "Validation error",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Invalid locale."),
                        new OA\Property(
                            property: "errors",
                            type: "object",
                            properties: [
                                new OA\Property(property: "locale", type: "array", items: new OA\Items(type: "string"))
                            ]
                        ),
                    ]
                )
            ),
        ]
    )]
    public function switch(Request $request, $locale): JsonResponse
    {
        // Validate locale
        if (!in_array($locale, ['en', 'ur'])) {
            return response()->json([
                'message' => 'Invalid locale.',
                'errors' => ['locale' => ['Invalid locale.']]
            ], 422);
        }

        Session::put('locale', $locale);
        App::setLocale($locale);

        return response()->json([
            'message' => 'Language changed successfully.',
            'locale' => $locale,
        ]);
    }

    #[OA\Get(
        path: "/api/translations/{locale?}",
        summary: "Get translations",
        description: "Retrieves all translations for the specified locale",
        tags: ["Language"],
        parameters: [
            new OA\Parameter(
                name: "locale",
                in: "path",
                required: false,
                description: "Language locale code (en or ur). If not provided, uses session locale.",
                schema: new OA\Schema(type: "string", enum: ["en", "ur"])
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Translations retrieved successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "locale", type: "string", example: "en"),
                        new OA\Property(
                            property: "translations",
                            type: "object",
                            description: "Nested object containing translations from different files",
                            additionalProperties: new OA\AdditionalProperties(type: "object")
                        ),
                    ]
                )
            ),
        ]
    )]
    public function translations(Request $request, $locale = null): JsonResponse
    {
        // Use provided locale or get from session
        $locale = $locale ?? Session::get('locale', config('app.locale'));
        
        // Validate locale
        if (!in_array($locale, ['en', 'ur'])) {
            $locale = config('app.locale');
        }

        $translations = [];
        
        // Load translation files
        $files = ['common', 'navigation', 'auth', 'forms', 'messages'];
        
        foreach ($files as $file) {
            $path = resource_path("lang/{$locale}/{$file}.php");
            if (file_exists($path)) {
                $translations[$file] = require $path;
            } else {
                // Fallback to English
                $fallbackPath = resource_path("lang/en/{$file}.php");
                if (file_exists($fallbackPath)) {
                    $translations[$file] = require $fallbackPath;
                }
            }
        }
        
        return response()->json([
            'locale' => $locale,
            'translations' => $translations,
        ]);
    }
}
