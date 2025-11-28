<?php

use Illuminate\Support\Facades\Route;

// Serve favicon directly
Route::get('/favicon.ico', function () {
    return response()->file(public_path('favicon.ico'));
});

// API routes are handled in routes/api.php
// All other routes serve the React app
// React Router will handle client-side routing
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api|sanctum|storage|build|favicon\.ico|robots\.txt).*');
