import "../css/app.css";
import "./bootstrap";

import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { authService } from "./services/auth";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
// Pages
import Home from "./Pages/Home";
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";
import Verify from "./Pages/Auth/Verify";
import SetPassword from "./Pages/Auth/SetPassword";
import Dashboard from "./Pages/Dashboard";
import DashboardDocuments from "./Pages/Dashboard/Documents";
import ProfileEdit from "./Pages/Profile/Edit";
import HelpersIndex from "./Pages/Helpers/Index";
import HelpersShow from "./Pages/Helpers/Show";
import BusinessesShow from "./Pages/Businesses/Show";
import BookingsIndex from "./Pages/Bookings/Index";
import BookingsShow from "./Pages/Bookings/Show";
import BookingsCreate from "./Pages/Bookings/Create";
import BookingsEdit from "./Pages/Bookings/Edit";
import ServiceListingsCreate from "./Pages/ServiceListings/Create";
import ServiceListingsEdit from "./Pages/ServiceListings/Edit";
import ServiceListingsMyListings from "./Pages/ServiceListings/MyListings";
import JobApplicationsIndex from "./Pages/JobApplications/Index";
import JobApplicationsCreate from "./Pages/JobApplications/Create";
import JobApplicationsShow from "./Pages/JobApplications/Show";
import JobApplicationsMyApplications from "./Pages/JobApplications/MyApplications";
import JobApplicationsMyRequestApplications from "./Pages/JobApplications/MyRequestApplications";
import BusinessDashboard from "./Pages/Business/Dashboard";
import BusinessWorkers from "./Pages/Business/Workers";
import BusinessWorkersCreate from "./Pages/Business/Workers/Create";
import BusinessWorkersEdit from "./Pages/Business/Workers/Edit";
import OnboardingHelper from "./Pages/Onboarding/Helper";
import OnboardingBusiness from "./Pages/Onboarding/Business";
import PageAbout from "./Pages/Pages/About";
import PageContact from "./Pages/Pages/Contact";
import PageFAQ from "./Pages/Pages/FAQ";
import PageTerms from "./Pages/Pages/Terms";
import PagePrivacy from "./Pages/Pages/Privacy";
import MessagesIndex from "./Pages/Messages/Index";

// Routes Component (inside providers)
function AppRoutes() {
    // Protected Route Component (has access to AuthProvider context)
    const ProtectedRoute = ({ children, requiredRoles = null }) => {
        const { user, loading } = useAuth();
        const location = useLocation();
        const isAuthenticated = authService.isAuthenticated();

        // Wait for AuthContext to finish loading before making decisions
        // This is crucial - we must wait for the user data to load on page refresh
        if (loading) {
            return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
        }

        // If no token, redirect to login immediately
        if (!isAuthenticated) {
            return <Navigate to="/login" replace />;
        }

        // If we have a token but no user after loading completes
        // AuthContext removes token on 401, so if we still have token but no user,
        // it might be a network error. For now, allow access and let API calls handle auth
        // The API will return 401 if token is invalid, and we'll handle it there
        // This prevents logout on page refresh due to temporary network issues
        if (isAuthenticated && !user && !loading) {
            // Token exists but user not loaded - could be network error
            // Allow access temporarily - API calls will validate the token
            // If token is invalid, API will return 401 and AuthContext will handle it
            return children;
        }

        // If we have user, proceed with checks
        if (user) {
            // Check role-based access if requiredRoles is specified
            if (requiredRoles && requiredRoles.length > 0) {
                const hasRequiredRole = requiredRoles.includes(user.role);
                if (!hasRequiredRole) {
                    // User doesn't have the required role - redirect to home
                    return <Navigate to="/" replace />;
                }
            }

            // Check if user needs to set a password (after OTP login)
            // Allow access to reset-password page itself
            const isOnPasswordResetPage = location.pathname === "/reset-password";

            if (!user.has_password && !isOnPasswordResetPage) {
                // User has no password - must set one before accessing any other protected route
                return <Navigate to="/reset-password?otp_login=true" replace />;
            }

            // Check if user hasn't completed onboarding - applies to ALL users
            const onboardingIncomplete = !user.onboarding_complete;

            if (onboardingIncomplete) {
                const isHelper = user.role === "helper";
                const isBusiness = user.role === "business";

                // Determine the correct onboarding page based on role
                let correctOnboardingPage = "/profile"; // Default for regular users
                if (isHelper) {
                    correctOnboardingPage = "/onboarding/helper";
                } else if (isBusiness) {
                    correctOnboardingPage = "/onboarding/business";
                }

                // Check if user is on the correct onboarding page
                const isOnCorrectOnboardingPage = location.pathname === correctOnboardingPage;

                // If not on correct onboarding page AND not setting password, redirect to onboarding
                if (!isOnCorrectOnboardingPage && !isOnPasswordResetPage) {
                    return <Navigate to={correctOnboardingPage} replace />;
                }
            }
        }

        // Final check: if no user after all checks, redirect to login
        if (!user) {
            return <Navigate to="/login" replace />;
        }

        return children;
    };

    // Guest Route - Only allow unauthenticated users
    const GuestRoute = ({ children }) => {
        const { user } = useAuth();

        // If user is authenticated, redirect to home
        if (user) {
            return <Navigate to="/" replace />;
        }

        return children;
    };

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={
                <GuestRoute>
                    <Login />
                </GuestRoute>
            } />
            <Route path="/register" element={
                <GuestRoute>
                    <Register />
                </GuestRoute>
            } />
            <Route path="/verify-otp" element={<Verify />} />
            <Route path="/reset-password" element={
                <ProtectedRoute>
                    <SetPassword />
                </ProtectedRoute>
            } />
            <Route path="/helpers" element={<HelpersIndex />} />
            <Route path="/helpers/:helperId" element={<HelpersShow />} />
            <Route path="/businesses/:businessId" element={<BusinessesShow />} />
            {/* Service listings browse removed - users can view helpers directly */}
            <Route path="/about" element={<PageAbout />} />
            <Route path="/contact" element={<PageContact />} />
            <Route path="/faq" element={<PageFAQ />} />
            <Route path="/terms" element={<PageTerms />} />
            <Route path="/privacy" element={<PagePrivacy />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />
            <Route path="/dashboard/documents" element={
                <ProtectedRoute>
                    <DashboardDocuments />
                </ProtectedRoute>
            } />
            <Route path="/profile" element={
                <ProtectedRoute>
                    <ProfileEdit />
                </ProtectedRoute>
            } />
            <Route path="/my-job-posts" element={
                <ProtectedRoute>
                    <BookingsIndex />
                </ProtectedRoute>
            } />
            <Route path="/job-posts/create" element={
                <ProtectedRoute>
                    <BookingsCreate />
                </ProtectedRoute>
            } />
            <Route path="/job-posts/:bookingId/edit" element={
                <ProtectedRoute>
                    <BookingsEdit />
                </ProtectedRoute>
            } />
            <Route path="/job-posts/:bookingId" element={<BookingsShow />} />
            <Route path="/service-listings/create" element={
                <ProtectedRoute>
                    <ServiceListingsCreate />
                </ProtectedRoute>
            } />
            <Route path="/service-listings/:listingId/edit" element={
                <ProtectedRoute>
                    <ServiceListingsEdit />
                </ProtectedRoute>
            } />
            <Route path="/my-service-listings" element={
                <ProtectedRoute>
                    <ServiceListingsMyListings />
                </ProtectedRoute>
            } />
            <Route path="/job-posts" element={
                <ProtectedRoute requiredRoles={["helper", "business"]}>
                    <JobApplicationsIndex />
                </ProtectedRoute>
            } />
            <Route path="/job-posts/:bookingId/apply" element={
                <ProtectedRoute>
                    <JobApplicationsCreate />
                </ProtectedRoute>
            } />
            <Route path="/job-applications/:applicationId" element={
                <ProtectedRoute>
                    <JobApplicationsShow />
                </ProtectedRoute>
            } />
            <Route path="/my-applications" element={
                <ProtectedRoute>
                    <JobApplicationsMyApplications />
                </ProtectedRoute>
            } />
            <Route path="/my-request-applications" element={
                <ProtectedRoute>
                    <JobApplicationsMyRequestApplications />
                </ProtectedRoute>
            } />
            <Route path="/business/dashboard" element={
                <ProtectedRoute>
                    <BusinessDashboard />
                </ProtectedRoute>
            } />
            <Route path="/business/workers" element={
                <ProtectedRoute>
                    <BusinessWorkers />
                </ProtectedRoute>
            } />
            <Route path="/business/workers/create" element={
                <ProtectedRoute>
                    <BusinessWorkersCreate />
                </ProtectedRoute>
            } />
            <Route path="/business/workers/:id/edit" element={
                <ProtectedRoute>
                    <BusinessWorkersEdit />
                </ProtectedRoute>
            } />
            <Route path="/onboarding/helper" element={
                <ProtectedRoute>
                    <OnboardingHelper />
                </ProtectedRoute>
            } />
            <Route path="/onboarding/business" element={
                <ProtectedRoute>
                    <OnboardingBusiness />
                </ProtectedRoute>
            } />
            <Route path="/messages" element={
                <ProtectedRoute>
                    <MessagesIndex />
                </ProtectedRoute>
            } />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

// Main App Component
function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <LanguageProvider>
                    <AppRoutes />
                </LanguageProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

// Render the app
const container = document.getElementById("app");
const root = createRoot(container);

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
