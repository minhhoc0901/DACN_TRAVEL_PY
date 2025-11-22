import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LocationListPage from './pages/LocationListPage';
import LocationDetailPage from './pages/LocationDetailPage';
import PlanPage from './pages/PlanPage';
import ItineraryDetail from './components/ItineraryDetail/ItineraryDetail';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/auth/PrivateRoute';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminLayout from './components/admin/layout/AdminLayout';
import UserManagement from './pages/admin/UserManagement';
import LocationManagement from './pages/admin/LocationManagement';
import TourManagement from './pages/admin/TourManagement';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CreateItinerary from './pages/CreateItinerary';
import UserTours from './components/users/Tour/UserTours';
import TourPreview from './components/users/Tour/TourPreview';
import EditTour from './components/users/Tour/EditTour';
import AdminChatPage from './pages/admin/AdminChatPage';
import TourListPage from './pages/TourListPage';
import BookingPage from './pages/BookingPage'; 
import PaymentPage from './pages/PaymentPage';
import PaymentResultPage from './pages/PaymentResultPage';
import MyBookingsPage from './pages/MyBookingsPage';
import InvoicePage from './pages/InvoicePage';
import ItineraryPlanner from './pages/ItineraryPlanner';
import VerifyInvoicePage from './pages/VerifyInvoicePage.js';
import NotificationManagement from './pages/admin/NotificationManagement';

const AppRouter = () => {
    return (
        <Routes>
            {/* ===== PUBLIC ROUTES ===== */}
            <Route path="/" element={<HomePage />} />
            <Route path="/locations" element={<LocationListPage />} />
            <Route path="/locations/:id" element={<LocationDetailPage />} />
            <Route path="/plan" element={<PlanPage />} />
            
            {/* ===== AUTH ROUTES ===== */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* ===== TOUR & ITINERARY ROUTES ===== */}
            <Route path="/create-itinerary" element={<CreateItinerary />} />
            <Route path="/tours" element={<TourListPage />} />
            <Route path="/tours/:id" element={<ItineraryDetail />} />
            <Route path="/itinerary-planner" element={<ItineraryPlanner />} />
            
            {/* ===== BOOKING & PAYMENT ROUTES ===== */}
            <Route path="/booking/:tourId" element={<BookingPage />} /> 
            <Route path="/payment/:bookingId" element={<PaymentPage />} />  
            <Route path="/bookings/invoice/:bookingId" element={<InvoicePage/>} /> 
            <Route path="/payment/result" element={<PaymentResultPage />} />
            <Route path="/verify-invoice/:token" element={<VerifyInvoicePage />} />
            
            {/* ===== USER PROTECTED ROUTES ===== */}
            <Route
                path="/profile"
                element={
                    <PrivateRoute>
                        <ProfilePage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/profile/my-bookings"
                element={
                    <PrivateRoute>
                        <MyBookingsPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/user/my-tours"
                element={
                    <PrivateRoute>
                        <UserTours />
                    </PrivateRoute>
                }
            />
            <Route
                path="/user/tour-preview/:id"
                element={
                    <PrivateRoute>
                        <TourPreview />
                    </PrivateRoute>
                }
            />
            <Route
                path="/user/edit-tour/:id"
                element={
                    <PrivateRoute>
                        <EditTour />
                    </PrivateRoute>
                }
            />
            
            {/* ===== ADMIN ROUTES ===== */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route path="users" element={<UserManagement />} />
                <Route path="locations" element={<LocationManagement />} />
                <Route path="tours" element={<TourManagement />} />
                <Route path="chat" element={<AdminChatPage />} />
                <Route path="notifications" element={<NotificationManagement />} />
            </Route>
            
            {/* ===== OTHER PAGES ===== */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
        </Routes>
    );
};

export default AppRouter;