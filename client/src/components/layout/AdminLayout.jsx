import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, 
  LogOut, Menu, X, Home, BarChart3, Eye
} from 'lucide-react';
import { useState } from 'react';
import useStore from '../../store/useStore';

const AdminLayout = () => {
  const { user, logout } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const adminNavLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, exact: true },
    { name: 'Products', path: '/admin/products', icon: <Package className="w-5 h-5" /> },
    { name: 'Orders', path: '/admin/orders', icon: <ShoppingCart className="w-5 h-5" /> },
    { name: 'Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> }
  ];

  const isActive = (path, exact) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight via-future-dusk to-midnight">
      {/* Admin Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="fixed left-0 top-0 bottom-0 glass-strong border-r border-white/10 z-50 transition-all"
      >
        <div className="flex flex-col h-full">
          {/* Logo & Toggle */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Admin Panel</h2>
                  <p className="text-xs text-purple-300">VibeMatch</p>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center mx-auto">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {adminNavLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(link.path, link.exact)
                    ? 'bg-gradient-accent text-white shadow-glow'
                    : 'text-purple-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.icon}
                {sidebarOpen && <span className="font-medium">{link.name}</span>}
              </Link>
            ))}
          </nav>

          {/* Admin User Info & Actions */}
          <div className="p-4 border-t border-white/10 space-y-2">
            {sidebarOpen ? (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                    <p className="text-xs text-purple-300">Administrator</p>
                  </div>
                </div>
                <Link
                  to="/"
                  className="flex items-center gap-3 px-4 py-2 rounded-lg text-blue-300 hover:bg-blue-500/10 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  <span className="text-sm">View User Site</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="w-full p-3 rounded-lg text-blue-300 hover:bg-blue-500/10 transition-colors mb-2"
                  title="View User Site"
                >
                  <Eye className="w-5 h-5 mx-auto" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full p-3 rounded-lg text-red-300 hover:bg-red-500/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 mx-auto" />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        animate={{ marginLeft: sidebarOpen ? 280 : 80 }}
        className="min-h-screen transition-all"
      >
        <div className="p-8">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
};

export default AdminLayout;
