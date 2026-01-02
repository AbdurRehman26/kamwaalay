<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\JobPostController;
use App\Http\Controllers\HelperController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ServiceListingController;
use App\Http\Controllers\JobApplicationController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerificationController;
use App\Http\Controllers\Auth\PhoneOtpController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\MessageController;
use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Broadcasting authentication
Broadcast::routes(['middleware' => ['auth:sanctum']]);

// Language routes
Route::post('/locale/{locale}', [LanguageController::class, 'switch']);
Route::get('/translations/{locale?}', [LanguageController::class, 'translations']);

// Public routes
Route::get('/home', [HomeController::class, 'index']);
Route::get('/about', [PageController::class, 'about']);
Route::get('/contact', [PageController::class, 'contact']);
Route::post('/contact', [PageController::class, 'sendContactMessage']);
Route::get('/faq', [PageController::class, 'faq']);
Route::get('/terms', [PageController::class, 'terms']);
Route::get('/privacy', [PageController::class, 'privacy']);

// Public helper/business routes
Route::get('/helpers', [HelperController::class, 'index']);
Route::get('/helpers/{helper}', [HelperController::class, 'show']);
Route::get('/businesses/{business}', [BusinessController::class, 'show']);

// Public service listings
Route::get('/service-listings', [ServiceListingController::class, 'index']);
Route::get('/service-listings/{serviceListing}', [ServiceListingController::class, 'show'])->where('serviceListing', '[0-9]+');

// Public job posts/service requests
Route::get('/job-posts/browse', [JobPostController::class, 'browse']);
Route::get('/job-posts/{jobPost}', [JobPostController::class, 'show']);

// Location search (already API-like)
Route::get('/karachi-locations/search', [PageController::class, 'searchKarachiLocations']);
Route::get('/locations/search', [PageController::class, 'searchLocations']);
Route::get('/cities', [PageController::class, 'cities']);

// Service types
Route::get('/service-types', [PageController::class, 'serviceTypes']);

// Languages
Route::get('/languages', [PageController::class, 'languages']);

// Authentication routes (public)
Route::middleware('guest')->group(function () {
    // Registration
    Route::get('/register', [RegisteredUserController::class, 'create']);
    Route::post('/register', [RegisteredUserController::class, 'store']);

    // Phone OTP Registration
    Route::get('/register/phone', [PhoneOtpController::class, 'create']);
    Route::post('/register/phone/send-otp', [PhoneOtpController::class, 'sendOtp']);
    Route::post('/register/phone/verify-otp', [PhoneOtpController::class, 'verifyOtp']);
    Route::post('/register/phone/resend-otp', [PhoneOtpController::class, 'resendOtp']);

    // OTP Verification
    Route::get('/verify-otp', [VerificationController::class, 'show']);
    Route::post('/verify-otp', [VerificationController::class, 'verify']);
    Route::post('/verify-otp/resend', [VerificationController::class, 'resend']);

    // Login
    Route::get('/login', [AuthenticatedSessionController::class, 'create']);
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);

    // Password Reset
    Route::get('/forgot-password', [PasswordResetLinkController::class, 'create']);
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store']);
    Route::get('/reset-password/{token}', [NewPasswordController::class, 'create']);
    Route::post('/reset-password', [NewPasswordController::class, 'store']);


});

// Authenticated routes (require Sanctum token)
Route::middleware('auth:sanctum')->group(function () {
    // User info
    Route::get('/user', [App\Http\Controllers\ProfileController::class, 'user']);

    // Dashboard
    Route::get('/dashboard', function () {
        $user = auth()->user()->load('roles');
        return response()->json([
            'user' => new UserResource($user),
            'roles' => $user->roles->pluck('name'),
        ]);
    });

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);

    // Set password (for OTP login users)
    Route::post('/password/set', [App\Http\Controllers\Auth\SetPasswordController::class, 'store']);
    Route::get('/profile/documents', [ProfileController::class, 'documents']);
    Route::post('/profile/documents', [ProfileController::class, 'storeDocument']);
    Route::post('/profile/photo', [ProfileController::class, 'updatePhoto']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/all', [NotificationController::class, 'all']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/bulk-read', [NotificationController::class, 'bulkMarkAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);

    // Password
    Route::put('/password', [PasswordController::class, 'update']);

    // Logout
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

    // User Sessions (device/login tracking)
    Route::get('/user/sessions', function (Request $request) {
        $sessions = $request->user()->userSessions()
            ->orderBy('last_activity', 'desc')
            ->get()
            ->map(function ($session) {
                return [
                    'id' => $session->id,
                    'device' => $session->device_description,
                    'device_type' => $session->device_type,
                    'browser' => $session->browser,
                    'platform' => $session->platform,
                    'ip_address' => $session->ip_address,
                    'is_mobile' => $session->is_mobile,
                    'last_activity' => $session->last_activity?->diffForHumans(),
                    'created_at' => $session->created_at?->diffForHumans(),
                ];
            });

        return response()->json([
            'sessions' => $sessions,
            'count' => $sessions->count(),
        ]);
    });

    Route::delete('/user/sessions/{session}', function (Request $request, int $session) {
        $userSession = $request->user()->userSessions()->findOrFail($session);

        // Delete the associated Sanctum token if exists
        if ($userSession->token_id) {
            $request->user()->tokens()->where('id', $userSession->token_id)->delete();
        }

        $userSession->delete();

        return response()->json(['message' => 'Session revoked successfully']);
    });

    // Helper profile management
    Route::get('/helpers/create', [HelperController::class, 'create']);
    Route::post('/helpers', [HelperController::class, 'store']);
    Route::get('/helpers/{helper}/edit', [HelperController::class, 'edit']);
    Route::put('/helpers/{helper}', [HelperController::class, 'update']);

    // Job Posts (user's own posts)
    Route::get('/my-job-posts', [JobPostController::class, 'index']);
    Route::get('/job-posts/create', [JobPostController::class, 'create']);
    Route::post('/job-posts', [JobPostController::class, 'store']);
    Route::patch('/job-posts/{jobPost}', [JobPostController::class, 'update']);
    Route::delete('/job-posts/{jobPost}', [JobPostController::class, 'destroy']);
    



    // Service Listings
    // IMPORTANT: More specific routes must come before parameterized routes
    Route::get('/service-listings/my-service-listings', [ServiceListingController::class, 'myListings']);
    Route::get('/service-listings/create', [ServiceListingController::class, 'create']);
    Route::post('/service-listings', [ServiceListingController::class, 'store']);
    Route::get('/service-listings/{serviceListing}/edit', [ServiceListingController::class, 'edit'])->where('serviceListing', '[0-9]+');
    Route::put('/service-listings/{serviceListing}', [ServiceListingController::class, 'update'])->where('serviceListing', '[0-9]+');
    Route::delete('/service-listings/{serviceListing}', [ServiceListingController::class, 'destroy'])->where('serviceListing', '[0-9]+');

    // Job Applications (browse and apply - requires authentication and helper/business role)
    Route::get('/job-posts', [JobApplicationController::class, 'index']);
    Route::get('/job-posts/{jobPost}/apply', [JobApplicationController::class, 'create']);
    Route::post('/job-posts/{jobPost}/apply', [JobApplicationController::class, 'store']);

    Route::get('/job-applications/{jobApplication}', [JobApplicationController::class, 'show']);
    Route::get('/my-applications', [JobApplicationController::class, 'myApplications']);
    Route::get('/my-request-applications', [JobApplicationController::class, 'myRequestApplications']);
    Route::post('/job-applications/{jobApplication}/accept', [JobApplicationController::class, 'accept']);
    Route::post('/job-applications/{jobApplication}/reject', [JobApplicationController::class, 'reject']);
    Route::post('/job-applications/{jobApplication}/withdraw', [JobApplicationController::class, 'withdraw']);
    Route::delete('/job-applications/{jobApplication}', [JobApplicationController::class, 'destroy']);

    // Reviews
    Route::get('/job-posts/{jobPost}/review/create', [ReviewController::class, 'create']);
    Route::post('/job-posts/{jobPost}/review', [ReviewController::class, 'store']);

    Route::get('/reviews/{review}/edit', [ReviewController::class, 'edit']);
    Route::put('/reviews/{review}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);

    // Business routes
    Route::prefix('business')->group(function () {
        Route::get('/dashboard', [BusinessController::class, 'dashboard']);
        Route::get('/workers', [BusinessController::class, 'workers']);
        Route::get('/workers/create', [BusinessController::class, 'createWorker']);
        Route::post('/workers', [BusinessController::class, 'storeWorker']);
        Route::get('/workers/{helper}/edit', [BusinessController::class, 'editWorker']);
        Route::match(['put', 'post'], '/workers/{helper}', [BusinessController::class, 'updateWorker']);
        Route::delete('/workers/{helper}', [BusinessController::class, 'destroyWorker']);
    });

    // Onboarding routes
    Route::get('/onboarding/helper', [OnboardingController::class, 'helper']);
    Route::post('/onboarding/helper', [OnboardingController::class, 'completeHelper']);
    Route::get('/onboarding/business', [OnboardingController::class, 'business']);
    Route::post('/onboarding/business', [OnboardingController::class, 'completeBusiness']);

    // Admin routes
    Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/helpers', [AdminController::class, 'helpers']);
        Route::patch('/helpers/{helper}/status', [AdminController::class, 'updateHelperStatus']);
        Route::get('/job-posts', [AdminController::class, 'bookings']);
        Route::get('/documents', [AdminController::class, 'documents']);
        Route::patch('/documents/{document}/status', [AdminController::class, 'updateDocumentStatus']);
    });

    // Messages/Chat routes
    Route::get('/conversations', [MessageController::class, 'getConversations']);
    Route::post('/conversations', [MessageController::class, 'store']);
    Route::get('/conversations/{conversation}/messages', [MessageController::class, 'getMessages']);
    Route::post('/messages', [MessageController::class, 'sendMessage']);
    Route::delete('/messages/{message}', [MessageController::class, 'deleteMessage']);
    Route::delete('/conversations/{conversation}', [MessageController::class, 'deleteConversation']);
});
