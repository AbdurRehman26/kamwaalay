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

test('getOrCreate creates a new conversation when it does not exist', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    
    expect($conversation)->toBeInstanceOf(Conversation::class);
    $this->assertDatabaseHas('conversations', [
        'user_one_id' => min($user1->id, $user2->id),
        'user_two_id' => max($user1->id, $user2->id),
    ]);
});

test('getOrCreate returns existing conversation when it exists', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $conversation1 = Conversation::getOrCreate($user1->id, $user2->id);
    $conversation2 = Conversation::getOrCreate($user1->id, $user2->id);
    
    expect($conversation1->id)->toBe($conversation2->id);
    $this->assertDatabaseCount('conversations', 1);
});

test('getOrCreate handles user order consistently', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $conversation1 = Conversation::getOrCreate($user1->id, $user2->id);
    $conversation2 = Conversation::getOrCreate($user2->id, $user1->id);
    
    expect($conversation1->id)->toBe($conversation2->id);
});

test('getOtherUser returns the correct user', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    
    $otherUser1 = $conversation->getOtherUser($user1->id);
    $otherUser2 = $conversation->getOtherUser($user2->id);
    
    expect($otherUser1->id)->toBe($user2->id);
    expect($otherUser2->id)->toBe($user1->id);
});

test('conversation has many messages', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    
    Message::factory()->count(3)->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $user1->id,
    ]);
    
    expect($conversation->messages)->toHaveCount(3);
});

test('conversation belongs to user one and user two', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    
    expect($conversation->userOne)->toBeInstanceOf(User::class);
    expect($conversation->userTwo)->toBeInstanceOf(User::class);
});

test('conversation has unique constraint on user pairs', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    Conversation::getOrCreate($user1->id, $user2->id);
    
    // Try to create duplicate - should not throw error but return existing
    $conversation2 = Conversation::getOrCreate($user1->id, $user2->id);
    
    $this->assertDatabaseCount('conversations', 1);
    expect($conversation2)->toBeInstanceOf(Conversation::class);
});

