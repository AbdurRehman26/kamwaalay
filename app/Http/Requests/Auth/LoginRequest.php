<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'max:20'],
            'password' => ['nullable', 'string'], // Password is optional - if not provided, OTP flow will be used
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $credentials = ['password' => $this->input('password')];

        // Add email or phone to credentials
        // For phone login, we need to find user by phone and use their email for Auth::attempt
        $phone = $this->formatPhoneNumber($this->input('phone'));
        // Try both formatted and original format for backward compatibility
        $user = User::where('phone', $phone)
            ->orWhere('phone', preg_replace('/[^0-9+]/', '', $this->input('phone')))
            ->first();
        if ($user) {
            $credentials['email'] = $user->email; // Auth::attempt requires email field
        }

        if (! Auth::attempt($credentials, $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'phone' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Verify credentials without logging in (for password-based login).
     *
     * @return User|null
     * @throws \Illuminate\Validation\ValidationException
     */
    public function verifyCredentials(): ?User
    {
        $this->ensureIsNotRateLimited();

        // Format phone number to +92xxxxx format
        $phone = $this->formatPhoneNumber($this->input('phone'));
        // Try both formatted and original format for backward compatibility
        $user = User::where('phone', $phone)
            ->orWhere('phone', preg_replace('/[^0-9+]/', '', $this->input('phone')))
            ->first();

        if (!$user) {
            RateLimiter::hit($this->throttleKey());

            $field = 'phone';
            throw ValidationException::withMessages([
                $field => trans('auth.failed'),
            ]);
        }

        // If password is provided, verify it
        if ($this->filled('password')) {
            if (!Hash::check($this->input('password'), $user->password)) {
                RateLimiter::hit($this->throttleKey());

                $field = 'phone';
                throw ValidationException::withMessages([
                    $field => trans('auth.failed'),
                ]);
            }
        }

        RateLimiter::clear($this->throttleKey());

        return $user;
    }

    /**
     * Find user by email or phone (for OTP flow).
     *
     * @return User|null
     * @throws \Illuminate\Validation\ValidationException
     */
    public function findUser(): ?User
    {
        $this->ensureIsNotRateLimited();

        $user = null;

        // Format phone number to +92xxxxx format
        $phone = $this->formatPhoneNumber($this->input('phone'));
        // Try both formatted and original format for backward compatibility
        $user = User::where('phone', $phone)
            ->orWhere('phone', preg_replace('/[^0-9+]/', '', $this->input('phone')))
            ->first();

        if (!$user) {
            RateLimiter::hit($this->throttleKey());

            $field = $this->filled('email') ? 'email' : 'phone';
            throw ValidationException::withMessages([
                $field => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());

        return $user;
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'phone' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        $identifier = $this->formatPhoneNumber($this->input('phone'));

        return Str::transliterate(Str::lower($identifier).'|'.$this->ip());
    }

    /**
     * Format phone number to +92xxxxx format
     * Handles formats like: 03xxxxxxxxx, 92xxxxxxxxx, +92xxxxxxxxx, 0092xxxxxxxxx
     */
    private function formatPhoneNumber(string $phone): string
    {
        // Remove all non-numeric characters except +
        $phone = preg_replace('/[^0-9+]/', '', $phone);

        // Remove leading + if present (we'll add it back at the end)
        $phone = ltrim($phone, '+');

        // Handle different input formats
        if (strpos($phone, '0092') === 0) {
            // Format: 0092xxxxxxxxx -> +92xxxxxxxxx
            $phone = substr($phone, 2); // Remove 00, keep 92
        } elseif (strpos($phone, '92') === 0 && strlen($phone) >= 12) {
            // Format: 92xxxxxxxxx -> +92xxxxxxxxx (already has country code)
            // Keep as is
        } elseif (strpos($phone, '0') === 0 && strlen($phone) >= 10) {
            // Format: 03xxxxxxxxx -> +923xxxxxxxxx (local format starting with 0)
            $phone = '92' . substr($phone, 1); // Remove leading 0, add 92
        } elseif (strlen($phone) >= 10 && strlen($phone) <= 11) {
            // Format: 3xxxxxxxxx (10-11 digits without leading 0 or country code)
            // Assume it's a local number, add 92
            $phone = '92' . $phone;
        } elseif (strlen($phone) < 10) {
            // Too short, might be incomplete - still try to format
            if (strpos($phone, '92') !== 0) {
                $phone = '92' . $phone;
            }
        }

        // Ensure it starts with +
        if (strpos($phone, '+') !== 0) {
            $phone = '+' . $phone;
        }

        return $phone;
    }
}
