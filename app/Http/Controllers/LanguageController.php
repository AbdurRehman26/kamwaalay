<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\App;

class LanguageController extends Controller
{
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
