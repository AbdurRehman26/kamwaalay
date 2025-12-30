<?php

namespace App\Services\SMS\Drivers;

use App\Services\SMS\SmsServiceInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VeevoTechDriver implements SmsServiceInterface
{
    protected string $url;
    protected ?string $apiKey;

    public function __construct()
    {
        $this->url = config('services.sms.veevotech.url', 'https://api.veevotech.com/v3/sendsms');
        $this->apiKey = config('services.sms.veevotech.api_key');
    }

    /**
     * Send an SMS message using VeevoTech API.
     *
     * @param string $to
     * @param string $message
     * @return bool
     */
    public function send(string $to, string $message): bool
    {
        try {
            // Format phone number to +923xxxxxxx
            $formattedTo = $this->formatPhoneNumber($to);

            $response = Http::get($this->url, [
                'hash' => $this->apiKey,
                'receivernum' => $formattedTo,
                'receivernetwork' => 'mobile', // Defaulting to mobile as network unknown
                'sendernum' => 'Default',
                'textmessage' => $message,
            ]);

            if ($response->successful()) {
                Log::info("SMS sent successfully to {$to}", ['response' => $response->body()]);
                return true;
            } else {
                Log::error("Failed to send SMS to {$to}", ['status' => $response->status(), 'response' => $response->body()]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error("Exception when sending SMS via VeevoTech: " . $e->getMessage());
            return false;
        }
    }

    private function formatPhoneNumber(string $phone): string
    {
        // Remove all non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // If starts with 0 (e.g., 0300...), replace with 92
        if (str_starts_with($phone, '0')) {
            $phone = '92' . substr($phone, 1);
        }

        // Keep existing handling for international format?
        // If it starts with 92, we keep it.
        // If it's just 300xxxxxxx, we assume PHP 92?
        // Let's assume standard normalization:

        // Add + prefix as per requirements
        return '+' . $phone;
    }
}
