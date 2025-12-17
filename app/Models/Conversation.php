<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_one_id',
        'user_two_id',
        'last_message_at',
        'user_one_deleted_at',
        'user_two_deleted_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'user_one_deleted_at' => 'datetime',
        'user_two_deleted_at' => 'datetime',
    ];

    /**
     * Get the deletion timestamp for a specific user
     */
    public function getDeletedAtForUser(int $userId): ?\Carbon\Carbon
    {
        if ($this->user_one_id === $userId) {
            return $this->user_one_deleted_at;
        }
        if ($this->user_two_id === $userId) {
            return $this->user_two_deleted_at;
        }
        return null;
    }

    /**
     * Mark conversation as deleted for a specific user
     */
    public function markAsDeletedForUser(int $userId): bool
    {
        if ($this->user_one_id === $userId) {
            $this->user_one_deleted_at = now();
            return $this->save();
        }
        if ($this->user_two_id === $userId) {
            $this->user_two_deleted_at = now();
            return $this->save();
        }
        return false;
    }

    /**
     * Clear deletion timestamp for a user (used when new messages arrive)
     */
    public function clearDeletedAtForUser(int $userId): bool
    {
        if ($this->user_one_id === $userId) {
            $this->user_one_deleted_at = null;
            return $this->save();
        }
        if ($this->user_two_id === $userId) {
            $this->user_two_deleted_at = null;
            return $this->save();
        }
        return false;
    }

    /**
     * Get user one
     */
    public function userOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    /**
     * Get user two
     */
    public function userTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    /**
     * Get messages for this conversation
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    /**
     * Get the other user in the conversation
     */
    public function getOtherUser(int $currentUserId): ?User
    {
        if ($this->user_one_id === $currentUserId) {
            return $this->userTwo;
        }
        return $this->userOne;
    }

    /**
     * Get or create a conversation between two users
     */
    public static function getOrCreate(int $userId1, int $userId2): self
    {
        // Ensure consistent ordering (smaller ID first)
        $userIds = [$userId1, $userId2];
        sort($userIds);

        $conversation = self::where('user_one_id', $userIds[0])
            ->where('user_two_id', $userIds[1])
            ->first();

        if (!$conversation) {
            $conversation = self::create([
                'user_one_id' => $userIds[0],
                'user_two_id' => $userIds[1],
            ]);
        }

        return $conversation;
    }
}

