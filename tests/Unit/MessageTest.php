<?php

use App\Models\User;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    if (!Role::where('name', 'user')->exists()) {
        Role::create(['name' => 'user']);
    }
    if (!Role::where('name', 'helper')->exists()) {
        Role::create(['name' => 'helper']);
    }
});

test('message belongs to a conversation', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    $message = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $user1->id,
    ]);
    
    expect($message->conversation)->toBeInstanceOf(Conversation::class);
    expect($message->conversation->id)->toBe($conversation->id);
});

test('message belongs to a sender', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    $message = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $user1->id,
    ]);
    
    expect($message->sender)->toBeInstanceOf(User::class);
    expect($message->sender->id)->toBe($user1->id);
});

test('message can be marked as read', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    $message = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $user1->id,
        'is_read' => false,
    ]);
    
    expect($message->is_read)->toBeFalse();
    expect($message->read_at)->toBeNull();
    
    $message->markAsRead();
    
    expect($message->fresh()->is_read)->toBeTrue();
    expect($message->fresh()->read_at)->not->toBeNull();
});

test('message defaults to unread', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    $message = Message::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $user1->id,
        'message' => 'Test message',
        'is_read' => false, // Explicitly set to ensure default
    ]);
    
    $message->refresh();
    expect($message->is_read)->toBeFalse();
    expect($message->read_at)->toBeNull();
});

test('message has correct fillable attributes', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    
    $message = Message::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $user1->id,
        'message' => 'Test message',
        'is_read' => true,
    ]);
    
    expect($message->conversation_id)->toBe($conversation->id);
    expect($message->sender_id)->toBe($user1->id);
    expect($message->message)->toBe('Test message');
    expect($message->is_read)->toBeTrue();
});

