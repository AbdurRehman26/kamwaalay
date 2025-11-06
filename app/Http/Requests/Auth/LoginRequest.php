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
            'email' => ['required_without:phone', 'nullable', 'string', 'email'],
            'phone' => ['required_without:email', 'nullable', 'string', 'max:20'],
            'password' => ['required', 'string'],
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
        if ($this->filled('email')) {
            $credentials['email'] = $this->input('email');
        } elseif ($this->filled('phone')) {
            // For phone login, we need to find user by phone and use their email for Auth::attempt
            $phone = preg_replace('/[^0-9+]/', '', $this->input('phone'));
            $user = User::where('phone', $phone)->first();
            if ($user) {
                $credentials['email'] = $user->email; // Auth::attempt requires email field
            }
        }

        if (! Auth::attempt($credentials, $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            $field = $this->filled('email') ? 'email' : 'phone';
            throw ValidationException::withMessages([
                $field => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Verify credentials without logging in (for OTP flow).
     *
     * @return User|null
     * @throws \Illuminate\Validation\ValidationException
     */
    public function verifyCredentials(): ?User
    {
        $this->ensureIsNotRateLimited();

        $user = null;

        // Check if login is by email or phone
        if ($this->filled('email')) {
            $user = User::where('email', $this->input('email'))->first();
        } elseif ($this->filled('phone')) {
            // Normalize phone number (remove spaces, dashes, etc.)
            $phone = preg_replace('/[^0-9+]/', '', $this->input('phone'));
            $user = User::where('phone', $phone)->first();
        }

        if (!$user || !Hash::check($this->input('password'), $user->password)) {
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
            'email' => trans('auth.throttle', [
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
        $identifier = $this->filled('email') 
            ? $this->string('email')
            : preg_replace('/[^0-9+]/', '', $this->input('phone'));
        
        return Str::transliterate(Str::lower($identifier).'|'.$this->ip());
    }
}
