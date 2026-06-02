<?php

use Illuminate\Support\Facades\Config;

test('public config api returns configured public app values', function () {
    Config::set('app.name', 'Kamwaalay');
    Config::set('app.locale', 'en');
    Config::set('client.app_version', '2.3.4');
    Config::set('client.min_supported_version', '2.0.0');
    Config::set('client.latest_version_url', 'https://www.kamwaalay.com/download');
    Config::set('client.support_phone', '+923001234567');
    Config::set('client.support_whatsapp', '+923001234567');
    Config::set('client.support_email', 'support@kamwaalay.com');
    Config::set('client.features.agency_signup', true);
    Config::set('client.features.demo_seeders', false);

    $this->getJson('/api/config')
        ->assertOk()
        ->assertJson([
            'app_name' => 'Kamwaalay',
            'app_version' => '2.3.4',
            'min_supported_version' => '2.0.0',
            'latest_version_url' => 'https://www.kamwaalay.com/download',
            'support_phone' => '+923001234567',
            'support_whatsapp' => '+923001234567',
            'support_email' => 'support@kamwaalay.com',
            'default_locale' => 'en',
            'features' => [
                'agency_signup' => true,
                'demo_seeders' => false,
            ],
        ]);
});
