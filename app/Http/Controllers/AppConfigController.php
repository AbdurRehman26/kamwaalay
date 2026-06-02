<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Config', description: 'Public app configuration endpoints')]
class AppConfigController extends Controller
{
    #[OA\Get(
        path: '/api/config',
        operationId: 'getAppConfig',
        summary: 'Get app config',
        description: 'Returns public app configuration values for clients such as mobile apps.',
        tags: ['Config'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Public app configuration',
                content: new OA\JsonContent(
                    type: 'object',
                    properties: [
                        new OA\Property(property: 'app_name', type: 'string', example: 'Kamwaalay', description: 'Public application name'),
                        new OA\Property(property: 'app_version', type: 'string', example: '1.0.0', description: 'Current app version'),
                        new OA\Property(property: 'min_supported_version', type: 'string', example: '1.0.0', description: 'Minimum supported client version'),
                        new OA\Property(property: 'latest_version_url', type: 'string', nullable: true, example: 'https://www.kamwaalay.com/download', description: 'Store or download URL for the latest app version'),
                        new OA\Property(property: 'support_phone', type: 'string', nullable: true, example: '+923001234567', description: 'Public support phone number'),
                        new OA\Property(property: 'support_whatsapp', type: 'string', nullable: true, example: '+923001234567', description: 'Public support WhatsApp number'),
                        new OA\Property(property: 'support_email', type: 'string', nullable: true, example: 'support@kamwaalay.com', description: 'Public support email'),
                        new OA\Property(property: 'default_locale', type: 'string', example: 'en', description: 'Default application locale'),
                        new OA\Property(
                            property: 'features',
                            type: 'object',
                            description: 'Public feature flags exposed to clients',
                            properties: [
                                new OA\Property(property: 'agency_signup', type: 'boolean', example: false),
                                new OA\Property(property: 'demo_seeders', type: 'boolean', example: false),
                            ],
                        ),
                    ],
                    example: [
                        'app_name' => 'Kamwaalay',
                        'app_version' => '1.0.0',
                        'min_supported_version' => '1.0.0',
                        'latest_version_url' => 'https://www.kamwaalay.com/download',
                        'support_phone' => '+923001234567',
                        'support_whatsapp' => '+923001234567',
                        'support_email' => 'support@kamwaalay.com',
                        'default_locale' => 'en',
                        'features' => [
                            'agency_signup' => false,
                            'demo_seeders' => false,
                        ],
                    ],
                )
            ),
        ]
    )]
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'app_name' => config('app.name'),
            'app_version' => config('client.app_version'),
            'min_supported_version' => config('client.min_supported_version'),
            'latest_version_url' => config('client.latest_version_url'),
            'support_phone' => config('client.support_phone'),
            'support_whatsapp' => config('client.support_whatsapp'),
            'support_email' => config('client.support_email'),
            'default_locale' => config('app.locale'),
            'features' => [
                'agency_signup' => config('client.features.agency_signup'),
                'demo_seeders' => config('client.features.demo_seeders'),
            ],
        ]);
    }
}
