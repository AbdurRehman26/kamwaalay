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
}
