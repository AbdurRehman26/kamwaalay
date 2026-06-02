<?php

return [
    'app_version' => env('APP_VERSION', '1.0.0'),
    'min_supported_version' => env('APP_MIN_SUPPORTED_VERSION', '1.0.0'),
    'latest_version_url' => env('APP_LATEST_VERSION_URL'),
    'support_phone' => env('APP_SUPPORT_PHONE'),
    'support_whatsapp' => env('APP_SUPPORT_WHATSAPP'),
    'support_email' => env('APP_SUPPORT_EMAIL'),
    'features' => [
        'agency_signup' => (bool) config('features.agency_signup'),
        'demo_seeders' => (bool) config('features.demo_seeders'),
    ],
];
