import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';

// Layouts
import Navbar from './components/layout/Navbar';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Chatbot from './components/Chatbot';

// User Pages
import Home from './pages/Home';
import Recommendations from './pages/Recommendations';
import ProductDetail from './pages/ProductDetail';
import Products from './pages/Products';
import VirtualPreview from './pages/VirtualPreview';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CompleteProfile from './pages/CompleteProfile';
import PersonalRecommendations from './pages/PersonalRecommendations';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import OrderTracking from './pages/OrderTracking';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Favorites from './pages/Favorites';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminAnalytics from './pages/admin/Analytics';

function App() {
  const { currentVibe } = useStore();

  // Update CSS variable when vibe changes
  useEffect(() => {
    document.body.className = `vibe-${currentVibe.toLowerCase()}`;
  }, [currentVibe]);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1F2937',
            color: '#fff',
            border: '1px solid #8B5CF6',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* User Routes */}
        <Route
          path="/*"
          element={
            <div className="min-h-screen bg-gradient-to-br from-midnight via-future-dusk to-midnight">
              <Navbar />
              <Chatbot />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/preview/:lookId" element={<VirtualPreview />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/cart" element={<Cart />} />
                <Route 
                  path="/complete-profile" 
                  element={
                    <ProtectedRoute skipProfileCheck>
                      <CompleteProfile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/for-you" 
                  element={
                    <ProtectedRoute>
                      <PersonalRecommendations />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/checkout" 
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/favorites" 
                  element={
                    <ProtectedRoute>
                      <Favorites />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/orders" 
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/orders/:orderId" 
                  element={
                    <ProtectedRoute>
                      <OrderDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/order-tracking" 
                  element={
                    <ProtectedRoute>
                      <OrderTracking />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </div>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
