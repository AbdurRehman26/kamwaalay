<?php

namespace App\Services\SMS;

interface SmsServiceInterface
{
    /**
     * Send an SMS message.
     *
     * @param string $to The phone number to send to.
     * @param string $message The message content.
     * @return bool True if successful, false otherwise.
     */
    public function send(string $to, string $message): bool;
}
