import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Search, 
  Edit, 
  Trash2, 
  UserCheck,
  UserX,
  Mail,
  Calendar,
  ShoppingBag,
  X
} from 'lucide-react';
import useStore from '../../store/useStore';

const hasValue = (value) => value !== undefined && value !== null && value !== '';

const getProfileCompletion = (user) => {
  const p = user?.personalProfile || {};
  const s = user?.styleProfile || {};

  const hasAge = hasValue(p.age);
  const hasGender = hasValue(p.gender) && p.gender !== 'Prefer not to say';
  const hasBodyType = hasValue(p.bodyType) && p.bodyType !== 'Prefer not to say';
  const hasSkinTone = hasValue(p.skinTone) && p.skinTone !== 'Prefer not to say';

  // Consider quiz/profile complete only when key personal details are present.
  const quizCompletedByDetails = hasAge && hasGender && hasBodyType && hasSkinTone;
  const quizCompletedByFlag = s.isComplete || p.isComplete;

  return {
    completed: quizCompletedByDetails || quizCompletedByFlag,
    hasAge,
    hasGender,
    hasBodyType,
    hasSkinTone,
  };
};

const AdminUsers = () => {
  const { token } = useStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter]);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter })
      });

      const { data } = await axios.get(
        `/api/admin/users?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewUserDetails = async (userId) => {
    try {
      const { data } = await axios.get(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUser(data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchUsers(pagination.currentPage);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Users Management</h1>
        <p className="text-gray-400 mt-1">Manage registered users and admins</p>
      </div>

      <div className="bg-midnight border border-violet-500/30 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Users</p>
              <p className="text-3xl font-bold text-white">{pagination.totalUsers || 0}</p>
            </div>
            <UserCheck className="w-10 h-10 text-violet-400" />
          </div>
        </div>
        <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Admins</p>
              <p className="text-3xl font-bold text-white">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <UserX className="w-10 h-10 text-pink-400" />
          </div>
        </div>
        <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Regular Users</p>
              <p className="text-3xl font-bold text-white">
                {users.filter(u => u.role === 'user').length}
              </p>
            </div>
            <ShoppingBag className="w-10 h-10 text-blue-400" />
          </div>
        </div>
      </div>

      <div className="bg-midnight border border-violet-500/30 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-violet-500/30 bg-violet-500/5">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">User</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Role</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Joined</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Orders</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Quiz Status</th>
                <th className="text-right py-4 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const completion = getProfileCompletion(user);
                  return (
                  <tr key={user._id} className="border-b border-violet-500/10 hover:bg-violet-500/5">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-gray-400 text-sm flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-pink-500/20 text-pink-400' 
                          : 'bg-violet-500/20 text-violet-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white">
                      {user.orders?.length || 0} orders
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-sm ${
                        completion.completed 
                          ? 'text-green-400' 
                          : 'text-gray-400'
                      }`}>
                        {completion.completed ? '✓ Completed' : '— Not completed'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewUserDetails(user._id)}
                          className="p-2 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-violet-500/30">
            <p className="text-gray-400 text-sm">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers)} of {pagination.totalUsers} users
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => fetchUsers(pagination.currentPage - 1)}
                className="px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-500/10"
              >
                Previous
              </button>
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => fetchUsers(pagination.currentPage + 1)}
                className="px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-500/10"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser.user}
          stats={selectedUser.stats}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
          onUpdate={() => {
            fetchUsers(pagination.currentPage);
          }}
          token={token}
        />
      )}
    </div>
  );
};

const UserDetailsModal = ({ user, stats, onClose, onUpdate, token }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(
        `/api/admin/users/${user._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('User updated successfully');
      setEditing(false);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-midnight border border-violet-500/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-midnight border-b border-violet-500/30 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-3 py-1 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1 text-gray-400 hover:bg-midnight rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-midnight rounded-lg p-4 space-y-3">
              {editing ? (
                <>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-3 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-white"><span className="text-gray-400">Name:</span> {user.name}</p>
                  <p className="text-white"><span className="text-gray-400">Email:</span> {user.email}</p>
                  <p className="text-white">
                    <span className="text-gray-400">Role:</span>{' '}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-pink-500/20 text-pink-400' : 'bg-violet-500/20 text-violet-400'
                    }`}>
                      {user.role}
                    </span>
                  </p>
                  <p className="text-white">
                    <span className="text-gray-400">Joined:</span> {new Date(user.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-midnight rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
              </div>
              <div className="bg-midnight rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-white">₹{stats.totalSpent.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Profile Setup Details</h3>
            <div className="bg-midnight rounded-lg p-4 space-y-2">
              <p className="text-white">
                <span className="text-gray-400">Age:</span> {user.personalProfile?.age ?? 'Not set'}
              </p>
              <p className="text-white">
                <span className="text-gray-400">Gender:</span> {user.personalProfile?.gender || 'Not set'}
              </p>
              <p className="text-white">
                <span className="text-gray-400">Body Type:</span> {user.personalProfile?.bodyType || 'Not set'}
              </p>
              <p className="text-white">
                <span className="text-gray-400">Skin Tone:</span> {user.personalProfile?.skinTone || 'Not set'}
              </p>
              <p className="text-white">
                <span className="text-gray-400">Quiz Status:</span>{' '}
                <span className={getProfileCompletion(user).completed ? 'text-green-400' : 'text-yellow-400'}>
                  {getProfileCompletion(user).completed ? 'Completed' : 'Not completed'}
                </span>
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Style Profile</h3>
            <div className="bg-midnight rounded-lg p-4 space-y-2">
              <p className="text-white">
                <span className="text-gray-400">Undertone:</span> {user.styleProfile?.undertone || 'Not set'}
              </p>
              <p className="text-white">
                <span className="text-gray-400">Favorite Vibes:</span>{' '}
                {user.styleProfile?.favoriteVibes?.length > 0 ? user.styleProfile.favoriteVibes.join(', ') : 'Not set'}
              </p>
              <p className="text-white">
                <span className="text-gray-400">Preferred Silhouette:</span>{' '}
                {user.styleProfile?.preferredSilhouette?.length > 0 ? user.styleProfile.preferredSilhouette.join(', ') : 'Not set'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
