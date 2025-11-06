<?php

use Illuminate\Support\Facades\Route;

// API routes are handled in routes/api.php
// All other routes serve the React app
// React Router will handle client-side routing
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api|sanctum|storage).*');
