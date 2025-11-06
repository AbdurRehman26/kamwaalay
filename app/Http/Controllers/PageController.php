<?php

namespace App\Http\Controllers;

use App\Models\City;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PageController extends Controller
{
    public function about(): JsonResponse
    {
        return response()->json(['message' => 'About page content']);
    }

    public function contact(): JsonResponse
    {
        return response()->json(['message' => 'Contact page content']);
    }

    public function faq(): JsonResponse
    {
        return response()->json(['message' => 'FAQ page content']);
    }

    public function terms(): JsonResponse
    {
        return response()->json(['message' => 'Terms page content']);
    }

    public function privacy(): JsonResponse
    {
        return response()->json(['message' => 'Privacy page content']);
    }

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
                $displayText = $location->area 
                    ? $location->city->name . ', ' . $location->area 
                    : $location->city->name;
                
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
