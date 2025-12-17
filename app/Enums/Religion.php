<?php

namespace App\Enums;

enum Religion: string
{
    case SUNNI_NAZAR_NIYAZ = 'sunni_nazar_niyaz';
    case SUNNI_NO_NAZAR_NIYAZ = 'sunni_no_nazar_niyaz';
    case SHIA = 'shia';
    case CHRISTIAN = 'christian';

    /**
     * Get all religion values as an array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get comma-separated values for validation rules
     */
    public static function validationString(): string
    {
        return implode(',', self::values());
    }

    /**
     * Get human-readable label for each religion
     */
    public function label(): string
    {
        return match($this) {
            self::SUNNI_NAZAR_NIYAZ => 'Sunni (Nazar Niyaz)',
            self::SUNNI_NO_NAZAR_NIYAZ => 'Sunni (No Nazar Niyaz)',
            self::SHIA => 'Shia',
            self::CHRISTIAN => 'Christian',
        };
    }
}
