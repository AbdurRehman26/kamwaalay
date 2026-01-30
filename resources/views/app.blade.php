<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="theme-color" content="#111827">

        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Social Media Meta Tags -->
        <meta property="og:site_name" content="{{ config('app.name', 'Kamwaalay') }}">
        <meta property="og:title" content="{{ config('app.name', 'Kamwaalay') }}">
        <meta property="og:description" content="Connect with skilled helpers and grow your business today.">
        <meta property="og:image" content="{{ asset('images/kamwaalay-poster.png') }}">
        <meta property="og:type" content="website">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:image" content="{{ asset('images/kamwaalay-poster.png') }}">

        <!-- PWA Manifest -->
        <link rel="manifest" href="{{ asset('manifest.json') }}">

        <!-- Favicon -->
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Google Places API -->
        <script src="https://maps.googleapis.com/maps/api/js?key={{ env('GOOGLE_PLACES_API_KEY') }}&libraries=places,geocoding&loading=async" async defer></script>
        <script src="https://polyfill.io/v3/polyfill.min.js?features=default"></script>

        <!-- Scripts -->
        <script>
            window.Laravel = {
                app_debug: {{ config('app.debug') ? 'true' : 'false' }}
            };
            // Make Google Maps API key available to Vite
            window.GOOGLE_MAPS_API_KEY = "{{ env('GOOGLE_PLACES_API_KEY') }}";
        </script>
        @viteReactRefresh
        @vite(['resources/js/app.jsx'])
    </head>
    <body class="font-sans antialiased" style="background-color: #111827;">
        <div id="app"></div>
    </body>
</html>
