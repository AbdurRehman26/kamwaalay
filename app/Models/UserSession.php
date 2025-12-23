<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;

class UserSession extends Model
{
    protected $fillable = [
        'user_id',
        'token_id',
        'ip_address',
        'user_agent',
        'device_type',
        'browser',
        'browser_version',
        'platform',
        'platform_version',
        'is_mobile',
        'location',
        'last_activity',
    ];

    protected function casts(): array
    {
        return [
            'is_mobile' => 'boolean',
            'last_activity' => 'datetime',
        ];
    }

    /**
     * Get the user that owns this session
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Create a new session record from a request
     */
    public static function createFromRequest(Request $request, int $userId, ?int $tokenId = null): self
    {
        $userAgent = $request->userAgent() ?? '';
        $parsed = self::parseUserAgent($userAgent);

        return self::create([
            'user_id' => $userId,
            'token_id' => $tokenId,
            'ip_address' => $request->ip(),
            'user_agent' => $userAgent,
            'device_type' => $parsed['device_type'],
            'browser' => $parsed['browser'],
            'browser_version' => $parsed['browser_version'],
            'platform' => $parsed['platform'],
            'platform_version' => $parsed['platform_version'],
            'is_mobile' => $parsed['is_mobile'],
            'last_activity' => now(),
        ]);
    }

    /**
     * Parse user agent string to extract device, browser, and platform info
     */
    public static function parseUserAgent(string $userAgent): array
    {
        $result = [
            'device_type' => 'desktop',
            'browser' => 'Unknown',
            'browser_version' => null,
            'platform' => 'Unknown',
            'platform_version' => null,
            'is_mobile' => false,
        ];

        if (empty($userAgent)) {
            return $result;
        }

        // Detect mobile devices
        $mobileKeywords = ['Mobile', 'Android', 'iPhone', 'iPad', 'iPod', 'webOS', 'BlackBerry', 'Opera Mini', 'IEMobile'];
        foreach ($mobileKeywords as $keyword) {
            if (stripos($userAgent, $keyword) !== false) {
                $result['is_mobile'] = true;
                break;
            }
        }

        // Detect device type
        if (stripos($userAgent, 'iPad') !== false || stripos($userAgent, 'Tablet') !== false) {
            $result['device_type'] = 'tablet';
            $result['is_mobile'] = true;
        } elseif ($result['is_mobile']) {
            $result['device_type'] = 'mobile';
        }

        // Detect platform/OS
        if (preg_match('/Windows NT ([\d.]+)/i', $userAgent, $matches)) {
            $result['platform'] = 'Windows';
            $result['platform_version'] = $matches[1];
        } elseif (preg_match('/Mac OS X ([\d_.]+)/i', $userAgent, $matches)) {
            $result['platform'] = 'macOS';
            $result['platform_version'] = str_replace('_', '.', $matches[1]);
        } elseif (preg_match('/iPhone OS ([\d_]+)/i', $userAgent, $matches)) {
            $result['platform'] = 'iOS';
            $result['platform_version'] = str_replace('_', '.', $matches[1]);
        } elseif (preg_match('/Android ([\d.]+)/i', $userAgent, $matches)) {
            $result['platform'] = 'Android';
            $result['platform_version'] = $matches[1];
        } elseif (stripos($userAgent, 'Linux') !== false) {
            $result['platform'] = 'Linux';
        }

        // Detect browser
        if (preg_match('/Edg[e]?\/([\d.]+)/i', $userAgent, $matches)) {
            $result['browser'] = 'Edge';
            $result['browser_version'] = $matches[1];
        } elseif (preg_match('/Chrome\/([\d.]+)/i', $userAgent, $matches)) {
            $result['browser'] = 'Chrome';
            $result['browser_version'] = $matches[1];
        } elseif (preg_match('/Firefox\/([\d.]+)/i', $userAgent, $matches)) {
            $result['browser'] = 'Firefox';
            $result['browser_version'] = $matches[1];
        } elseif (preg_match('/Safari\/([\d.]+)/i', $userAgent, $matches) && stripos($userAgent, 'Chrome') === false) {
            $result['browser'] = 'Safari';
            // Safari version is in Version/x.x
            if (preg_match('/Version\/([\d.]+)/i', $userAgent, $versionMatches)) {
                $result['browser_version'] = $versionMatches[1];
            } else {
                $result['browser_version'] = $matches[1];
            }
        } elseif (preg_match('/MSIE ([\d.]+)/i', $userAgent, $matches) || stripos($userAgent, 'Trident') !== false) {
            $result['browser'] = 'Internet Explorer';
            $result['browser_version'] = $matches[1] ?? null;
        } elseif (preg_match('/Opera\/([\d.]+)/i', $userAgent, $matches) || preg_match('/OPR\/([\d.]+)/i', $userAgent, $matches)) {
            $result['browser'] = 'Opera';
            $result['browser_version'] = $matches[1];
        }

        return $result;
    }

    /**
     * Update last activity timestamp
     */
    public function updateLastActivity(): bool
    {
        $this->last_activity = now();
        return $this->save();
    }

    /**
     * Get a human-readable device description
     */
    public function getDeviceDescriptionAttribute(): string
    {
        $parts = [];

        if ($this->browser && $this->browser !== 'Unknown') {
            $browser = $this->browser;
            if ($this->browser_version) {
                $browser .= ' ' . explode('.', $this->browser_version)[0]; // Major version only
            }
            $parts[] = $browser;
        }

        if ($this->platform && $this->platform !== 'Unknown') {
            $parts[] = 'on ' . $this->platform;
        }

        if ($this->device_type !== 'desktop') {
            $parts[] = '(' . ucfirst($this->device_type) . ')';
        }

        return implode(' ', $parts) ?: 'Unknown Device';
    }
}
