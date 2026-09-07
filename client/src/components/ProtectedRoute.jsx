import { Navigate, useLocation } from 'react-router-dom';
import useStore from '../store/useStore';

const ProtectedRoute = ({ children, adminOnly = false, skipProfileCheck = false }) => {
  const { user, token, isProfileComplete } = useStore();
  const location = useLocation();

  // Check if user is logged in
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if admin access is required
  if (adminOnly && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-strong rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">
            You don't have permission to access this page. Admin privileges required.
          </p>
          <button
            onClick={() => window.history.back()}
            className="btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if profile is complete (skip for admin users and the complete-profile page itself)
  if (
    !skipProfileCheck && 
    !isProfileComplete && 
    user.role !== 'admin' && 
    location.pathname !== '/complete-profile'
  ) {
    return <Navigate to="/complete-profile" replace />;
  }

  return children;
};

export default ProtectedRoute;
