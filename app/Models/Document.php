<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'document_type',
        'document_number',
        'file_path',
        'status',
        'admin_notes',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function helper(): BelongsTo
    {
        return $this->user();
    }

    public function getDocumentTypeLabelAttribute(): string
    {
        return match($this->document_type) {
            'aadhaar' => 'Aadhaar Card',
            'police_verification' => 'Police Verification',
            'nic' => 'National Identity Card (NIC)',
            'other' => 'Other Document',
            default => ucfirst($this->document_type),
        };
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeVerified($query)
    {
        return $query->where('status', 'verified');
    }
}
