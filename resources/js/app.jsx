import '../css/app.css';
import './bootstrap';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
// Pages
import Home from './Pages/Home';
import Login from './Pages/Auth/Login';
import Register from './Pages/Auth/Register';
import Verify from './Pages/Auth/Verify';
import Dashboard from './Pages/Dashboard';
import ProfileEdit from './Pages/Profile/Edit';
import HelpersIndex from './Pages/Helpers/Index';
import HelpersShow from './Pages/Helpers/Show';
import BusinessesShow from './Pages/Businesses/Show';
import BookingsIndex from './Pages/Bookings/Index';
import BookingsShow from './Pages/Bookings/Show';
import BookingsCreate from './Pages/Bookings/Create';
import ServiceListingsIndex from './Pages/ServiceListings/Index';
import ServiceListingsShow from './Pages/ServiceListings/Show';
import ServiceListingsCreate from './Pages/ServiceListings/Create';
import ServiceListingsEdit from './Pages/ServiceListings/Edit';
import ServiceListingsMyListings from './Pages/ServiceListings/MyListings';
import ServiceRequestsBrowse from './Pages/ServiceRequests/Browse';
import JobApplicationsIndex from './Pages/JobApplications/Index';
import JobApplicationsCreate from './Pages/JobApplications/Create';
import JobApplicationsShow from './Pages/JobApplications/Show';
import JobApplicationsMyApplications from './Pages/JobApplications/MyApplications';
import JobApplicationsMyRequestApplications from './Pages/JobApplications/MyRequestApplications';
import BusinessDashboard from './Pages/Business/Dashboard';
import BusinessWorkers from './Pages/Business/Workers';
import OnboardingHelper from './Pages/Onboarding/Helper';
import OnboardingBusiness from './Pages/Onboarding/Business';
import PageAbout from './Pages/Pages/About';
import PageContact from './Pages/Pages/Contact';
import PageFAQ from './Pages/Pages/FAQ';
import PageTerms from './Pages/Pages/Terms';
import PagePrivacy from './Pages/Pages/Privacy';

// Routes Component (inside providers)
function AppRoutes() {
    // Protected Route Component (has access to AuthProvider context)
    const ProtectedRoute = ({ children }) => {
        const { user, loading } = useAuth();
        
        if (loading) {
            return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
        }
        
        if (!user) {
            return <Navigate to="/login" replace />;
        }
        
        return children;
    };

    return (
        <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-otp" element={<Verify />} />
                    <Route path="/helpers" element={<HelpersIndex />} />
                    <Route path="/helpers/:helperId" element={<HelpersShow />} />
                    <Route path="/businesses/:businessId" element={<BusinessesShow />} />
                    <Route path="/service-listings" element={<ServiceListingsIndex />} />
                    <Route path="/service-listings/:listingId" element={<ServiceListingsShow />} />
                    <Route path="/service-requests" element={<ServiceRequestsBrowse />} />
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
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <ProfileEdit />
                        </ProtectedRoute>
                    } />
                    <Route path="/bookings" element={
                        <ProtectedRoute>
                            <BookingsIndex />
                        </ProtectedRoute>
                    } />
                    <Route path="/bookings/create" element={
                        <ProtectedRoute>
                            <BookingsCreate />
                        </ProtectedRoute>
                    } />
                    <Route path="/service-requests/:bookingId" element={<BookingsShow />} />
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
                    <Route path="/job-applications" element={
                        <ProtectedRoute>
                            <JobApplicationsIndex />
                        </ProtectedRoute>
                    } />
                    <Route path="/bookings/:bookingId/apply" element={
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
                    
                    {/* Catch all - redirect to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
    );
}

// Main App Component
function App() {
    return (
        <AuthProvider>
            <LanguageProvider>
                <AppRoutes />
            </LanguageProvider>
        </AuthProvider>
    );
}

// Render the app
const container = document.getElementById('app');
const root = createRoot(container);

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
