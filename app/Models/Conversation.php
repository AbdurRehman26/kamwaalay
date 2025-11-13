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
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

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

