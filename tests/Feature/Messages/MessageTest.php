<?php

use App\Models\User;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use App\Events\MessageSent;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    if (!Role::where('name', 'user')->exists()) {
        Role::create(['name' => 'user']);
    }
    if (!Role::where('name', 'helper')->exists()) {
        Role::create(['name' => 'helper']);
    }
    if (!Role::where('name', 'business')->exists()) {
        Role::create(['name' => 'business']);
    }
});

test('authenticated users can get their conversations', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('user');
    
    $user2 = User::factory()->create();
    $user2->assignRole('helper');
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $user1->id,
        'message' => 'Hello',
    ]);
    
    $token = $user1->createToken('test-token')->plainTextToken;
    
    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/conversations');
    
    $response->assertStatus(200);
    $response->assertJsonStructure([
        'conversations' => [
            '*' => [
                'id',
                'other_user',
                'last_message',
                'unread_count',
            ]
        ]
    ]);
    $response->assertJsonCount(1, 'conversations');
});

test('users can send messages to other users', function () {
    Event::fake();
    
    $user1 = User::factory()->create();
    $user1->assignRole('user');
    
    $user2 = User::factory()->create();
    $user2->assignRole('helper');
    
    $token = $user1->createToken('test-token')->plainTextToken;
    
    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson('/api/messages', [
        'recipient_id' => $user2->id,
        'message' => 'Hello, how are you?',
    ]);
    
    $response->assertStatus(201);
    $response->assertJsonStructure([
        'message' => [
            'id',
            'conversation_id',
            'sender_id',
            'message',
            'sender',
        ],
        'conversation',
    ]);
    
    $this->assertDatabaseHas('messages', [
        'sender_id' => $user1->id,
        'message' => 'Hello, how are you?',
    ]);
    
    // Verify conversation was created
    $this->assertDatabaseHas('conversations', [
        'user_one_id' => min($user1->id, $user2->id),
        'user_two_id' => max($user1->id, $user2->id),
    ]);
    
    // Verify event was dispatched
    Event::assertDispatched(MessageSent::class);
});

test('users cannot send messages to themselves', function () {
    $user = User::factory()->create();
    $user->assignRole('user');
    
    $token = $user->createToken('test-token')->plainTextToken;
    
    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson('/api/messages', [
        'recipient_id' => $user->id,
        'message' => 'Hello',
    ]);
    
    $response->assertStatus(422);
    $response->assertJson([
        'message' => 'Cannot send message to yourself',
    ]);
});

test('users can get messages for a conversation', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('user');
    
    $user2 = User::factory()->create();
    $user2->assignRole('helper');
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    
    $message1 = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $user1->id,
        'message' => 'First message',
    ]);
    
    $message2 = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $user2->id,
        'message' => 'Second message',
    ]);
    
    $token = $user1->createToken('test-token')->plainTextToken;
    
    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson("/api/conversations/{$conversation->id}/messages");
    
    $response->assertStatus(200);
    $response->assertJsonStructure([
        'messages' => [
            'data' => [
                '*' => [
                    'id',
                    'sender_id',
                    'message',
                    'sender',
                ]
            ]
        ]
    ]);
    
    // Verify messages are marked as read
    $this->assertDatabaseHas('messages', [
        'id' => $message2->id,
        'is_read' => true,
    ]);
});

test('users cannot access messages from conversations they are not part of', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('user');
    
    $user2 = User::factory()->create();
    $user2->assignRole('helper');
    
    $user3 = User::factory()->create();
    $user3->assignRole('user');
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    
    $token = $user3->createToken('test-token')->plainTextToken;
    
    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson("/api/conversations/{$conversation->id}/messages");
    
    $response->assertStatus(403);
});

test('message validation requires recipient_id and message', function () {
    $user = User::factory()->create();
    $user->assignRole('user');
    
    $token = $user->createToken('test-token')->plainTextToken;
    
    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson('/api/messages', []);
    
    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['recipient_id', 'message']);
});

test('message cannot exceed maximum length', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('user');
    
    $user2 = User::factory()->create();
    $user2->assignRole('helper');
    
    $token = $user1->createToken('test-token')->plainTextToken;
    
    $longMessage = str_repeat('a', 5001); // Exceeds 5000 character limit
    
    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson('/api/messages', [
        'recipient_id' => $user2->id,
        'message' => $longMessage,
    ]);
    
    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['message']);
});

test('conversation is reused when sending multiple messages between same users', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('user');
    
    $user2 = User::factory()->create();
    $user2->assignRole('helper');
    
    $token = $user1->createToken('test-token')->plainTextToken;
    
    // Send first message
    $response1 = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson('/api/messages', [
        'recipient_id' => $user2->id,
        'message' => 'First message',
    ]);
    
    $conversationId1 = $response1->json('conversation.id');
    
    // Send second message
    $response2 = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson('/api/messages', [
        'recipient_id' => $user2->id,
        'message' => 'Second message',
    ]);
    
    $conversationId2 = $response2->json('conversation.id');
    
    // Both messages should be in the same conversation
    expect($conversationId1)->toBe($conversationId2);
    
    // Verify only one conversation exists
    $this->assertDatabaseCount('conversations', 1);
});

test('unauthenticated users cannot access conversations', function () {
    $response = $this->getJson('/api/conversations');
    
    $response->assertStatus(401);
});

test('unauthenticated users cannot send messages', function () {
    $user = User::factory()->create();
    
    $response = $this->postJson('/api/messages', [
        'recipient_id' => $user->id,
        'message' => 'Hello',
    ]);
    
    $response->assertStatus(401);
});

test('conversation last_message_at is updated when new message is sent', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('user');
    
    $user2 = User::factory()->create();
    $user2->assignRole('helper');
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    $originalTime = $conversation->last_message_at;
    
    // Wait a moment to ensure time difference
    sleep(1);
    
    $token = $user1->createToken('test-token')->plainTextToken;
    
    $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson('/api/messages', [
        'recipient_id' => $user2->id,
        'message' => 'New message',
    ]);
    
    $conversation->refresh();
    
    expect($conversation->last_message_at)->not->toBeNull();
    if ($originalTime) {
        expect($conversation->last_message_at->gt($originalTime))->toBeTrue();
    }
});

