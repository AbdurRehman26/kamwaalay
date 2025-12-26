<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'locale' => app()->getLocale(),
            'translations' => $this->getTranslations(),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'message' => $request->session()->get('message'),
            ],
            'app_debug' => config('app.debug'),
        ];
    }

    /**
     * Get translations for the current locale
     */
    protected function getTranslations(): array
    {
        $locale = app()->getLocale();
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
        
        return $translations;
    }
}
