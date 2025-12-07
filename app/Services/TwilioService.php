<?php

namespace App\Services;

use Twilio\Rest\Client;
use Illuminate\Support\Facades\Log;
use Exception;

class TwilioService
{
    protected $client;
    protected $fromNumber;

    public function __construct()
    {
        $accountSid = config('services.twilio.account_sid');
        $authToken = config('services.twilio.auth_token');
        $this->fromNumber = config('services.twilio.from_number');

        if (!$accountSid || !$authToken || !$this->fromNumber) {
            throw new Exception('Twilio credentials are not configured. Please check your .env file.');
        }

        $this->client = new Client($accountSid, $authToken);
    }

    /**
     * Send SMS message
     *
     * @param string $to Phone number in E.164 format (e.g., +923001234567)
     * @param string $message Message content
     * @return bool
     */
    public function sendSms(string $to, string $message): bool
    {
        try {
            // Ensure phone number is in E.164 format
            $to = $this->formatPhoneNumber($to);

            $message = $this->client->messages->create(
                $to,
                [
                    'from' => $this->fromNumber,
                    'body' => $message,
                ]
            );

            Log::info('Twilio SMS sent successfully', [
                'to' => $to,
                'message_sid' => $message->sid,
                'status' => $message->status,
            ]);

            return true;
        } catch (Exception $e) {
            Log::error('Twilio SMS sending failed', [
                'to' => $to,
                'error' => $e->getMessage(),
                'error_code' => $e->getCode(),
            ]);

            // In development, still log the message
            if (config('app.debug')) {
                Log::info('SMS Message (Twilio failed):', [
                    'to' => $to,
                    'message' => $message,
                ]);
            }

            throw $e;
        }
    }

    /**
     * Send OTP via SMS
     *
     * @param string $phone Phone number
     * @param string $otp OTP code
     * @param string $type Type of OTP (login, registration, etc.)
     * @return bool
     */
    public function sendOtp(string $phone, string $otp, string $type = 'verification'): bool
    {
        $messages = [
            'login' => "Your kamwaalay login verification code is: {$otp}. Valid for 3 minutes.",
            'registration' => "Your kamwaalay registration verification code is: {$otp}. Valid for 3 minutes.",
            'verification' => "Your kamwaalay verification code is: {$otp}. Valid for 3 minutes.",
        ];

        $message = $messages[$type] ?? $messages['verification'];

        return $this->sendSms($phone, $message);
    }

    /**
     * Format phone number to E.164 format
     *
     * @param string $phone Phone number
     * @return string Formatted phone number
     */
    protected function formatPhoneNumber(string $phone): string
    {
        // Remove all non-numeric characters except +
        $phone = preg_replace('/[^0-9+]/', '', $phone);

        // If phone doesn't start with +, assume it's a Pakistani number and add +92
        if (!str_starts_with($phone, '+')) {
            // Remove leading 0 if present
            if (str_starts_with($phone, '0')) {
                $phone = substr($phone, 1);
            }
            // Add +92 country code for Pakistan
            $phone = '+92' . $phone;
        }

        return $phone;
    }
}










