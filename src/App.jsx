import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import StudentLayout from '@/components/layouts/StudentLayout';
import AdminLayout from '@/components/layouts/AdminLayout';
// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Public + student pages
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/student/Dashboard';
import LiveQueue from '@/pages/student/LiveQueue';
import FoodMenu from '@/pages/student/FoodMenu';
import MessOccupancy from '@/pages/student/MessOccupancy';
import Predictions from '@/pages/student/Predictions';
import FoodReviews from '@/pages/student/FoodReviews';
import Notifications from '@/pages/student/Notifications';
import Profile from '@/pages/student/Profile';
// Staff / admin pages
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminQueue from '@/pages/admin/AdminQueue';
import AdminOccupancy from '@/pages/admin/AdminOccupancy';
import AdminMenu from '@/pages/admin/AdminMenu';
import AdminInventory from '@/pages/admin/AdminInventory';
import AdminScanner from '@/pages/admin/AdminScanner';
import AdminStudents from '@/pages/admin/AdminStudents';
import AdminComplaints from '@/pages/admin/AdminComplaints';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminReports from '@/pages/admin/AdminReports';
import AdminSettings from '@/pages/admin/AdminSettings';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<StudentLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/queue" element={<LiveQueue />} />
          <Route path="/menu" element={<FoodMenu />} />
          <Route path="/occupancy" element={<MessOccupancy />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/reviews" element={<FoodReviews />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminOverview />} />
          <Route path="/admin/queue" element={<AdminQueue />} />
          <Route path="/admin/occupancy" element={<AdminOccupancy />} />
          <Route path="/admin/menu" element={<AdminMenu />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/scanner" element={<AdminScanner />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/complaints" element={<AdminComplaints />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="/staff" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App