<?php

namespace Tests\Unit\Services\SMS;

use App\Services\SMS\Drivers\VeevoTechDriver;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class VeevoTechDriverTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock configuration
        Config::set('services.sms.veevotech.url', 'https://api.veevotech.com/v3/sendsms');
        Config::set('services.sms.veevotech.api_key', 'mock_api_key');
    }

    public function test_it_sends_sms_successfully()
    {
        // Fake the HTTP response
        Http::fake([
            'api.veevotech.com/*' => Http::response(['status' => 'success'], 200),
        ]);

        $driver = new VeevoTechDriver();
        $result = $driver->send('03001234567', 'Hello World');

        $this->assertTrue($result);

        // Verify request was sent correctly
        Http::assertSent(function ($request) {
            return str_starts_with($request->url(), 'https://api.veevotech.com/v3/sendsms') &&
                   $request['hash'] == 'mock_api_key' &&
                   $request['receivernum'] == '+923001234567' &&
                   $request['receivernetwork'] == 'mobile' &&
                   $request['sendernum'] == 'Default' &&
                   $request['textmessage'] == 'Hello World';
        });
    }

    public function test_it_handles_failure()
    {
        Http::fake([
            'api.veevotech.com/*' => Http::response(['status' => 'error'], 500),
        ]);

        $driver = new VeevoTechDriver();
        $result = $driver->send('03001234567', 'Hello World');

        $this->assertFalse($result);
    }
}
