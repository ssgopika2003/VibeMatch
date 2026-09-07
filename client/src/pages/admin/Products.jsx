import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Package,
  AlertCircle,
  X,
  Image as ImageIcon
} from 'lucide-react';
import useStore from '../../store/useStore';
import { getEffectivePrice } from '../../utils/priceUtils';

const AdminProducts = () => {
  const { token } = useStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, categoryFilter, stockFilter]);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(stockFilter && { stock: stockFilter })
      });

      const { data } = await axios.get(
        `/api/admin/products?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Products Management</h1>
          <p className="text-gray-400 mt-1">Manage your product catalog</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-midnight border border-violet-500/30 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Categories</option>
            <option value="Dress">Dress</option>
            <option value="Ornament">Ornament</option>
            <option value="Cosmetic">Cosmetic</option>
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Stock Levels</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('');
              setStockFilter('');
            }}
            className="px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg hover:bg-violet-500/10"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-midnight border border-violet-500/30 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-violet-500/30 bg-violet-500/5">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Product</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Category</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Price</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Stock</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Sales</th>
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="border-b border-violet-500/10 hover:bg-violet-500/5">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-violet-600/20 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {product.images?.[0]?.url ? (
                            <img 
                              src={product.images[0].url} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-violet-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <p className="text-gray-400 text-sm truncate max-w-xs">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/20 text-violet-400">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white">
                      ₹{getEffectivePrice(product).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          product.totalStock === 0 
                            ? 'text-red-400' 
                            : product.totalStock <= 10 
                            ? 'text-amber-400' 
                            : 'text-green-400'
                        }`}>
                          {product.totalStock}
                        </span>
                        {product.totalStock <= 10 && product.totalStock > 0 && (
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white">
                      {product.purchaseCount || 0}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-violet-500/30">
            <p className="text-gray-400 text-sm">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalProducts)} of {pagination.totalProducts} products
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => fetchProducts(pagination.currentPage - 1)}
                className="px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-500/10"
              >
                Previous
              </button>
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => fetchProducts(pagination.currentPage + 1)}
                className="px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-500/10"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showModal && (
        <ProductFormModal
          product={editingProduct}
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            fetchProducts();
          }}
          token={token}
        />
      )}
    </div>
  );
};

// Product Form Modal Component
const ProductFormModal = ({ product, onClose, onSuccess, token }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || 'Dress',
    subcategory: product?.subcategory || '',
    price: product?.price || '',
    discountPrice: product?.discountPrice || '',
    vibeTags: product?.vibeTags || [],
    undertoneCompatibility: product?.undertoneCompatibility || [],
    seasonalPalette: product?.seasonalPalette || [],
    silhouette: product?.silhouette || '',
    material: product?.material || '',
    totalStock: product?.totalStock || 0,
    images: product?.images || [{ url: '', color: '', isPrimary: true }],
    variants: product?.variants || [],
    colors: product?.colors || [],
    recommendedFor: product?.recommendedFor || {
      ageGroup: [],
      gender: [],
      bodyType: [],
      skinTone: []
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [showVariantBuilder, setShowVariantBuilder] = useState(false);

  const vibeOptions = ['Casual', 'Formal', 'Party', 'Wedding', 'Cocktail', 'Professional', 'Elegant', 'Chic'];
  const undertoneOptions = ['Warm', 'Cool', 'Neutral'];
  const seasonOptions = ['Winter', 'Spring', 'Summer', 'Autumn'];
  const silhouetteOptions = ['A-Line', 'Relaxed', 'Fitted', 'Flowing', 'Structured', 'Oversized'];

  // Recommendation targeting options
  const ageGroupOptions = ['Teen (13-17)', 'Young Adult (18-25)', 'Adult (26-35)', 'Mid-Age (36-50)', 'Mature (50+)', 'All Ages'];
  const genderOptions = ['Woman', 'Man', 'Non-Binary', 'Unisex'];
  const bodyTypeOptions = ['Petite', 'Slim', 'Athletic', 'Curvy', 'Plus-Size', 'Tall', 'All Body Types'];
  const skinToneTargetOptions = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Brown', 'Deep', 'All Skin Tones'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = product 
        ? `/api/admin/products/${product._id}`
        : '/api/admin/products';
      
      const method = product ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(product ? 'Product updated successfully' : 'Product created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleArrayValue = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const toggleRecommendedFor = (subField, value) => {
    setFormData(prev => ({
      ...prev,
      recommendedFor: {
        ...prev.recommendedFor,
        [subField]: prev.recommendedFor[subField]?.includes(value)
          ? prev.recommendedFor[subField].filter(v => v !== value)
          : [...(prev.recommendedFor[subField] || []), value]
      }
    }));
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, { url: '', color: '', isPrimary: false }]
    }));
  };

  const removeImageField = (index) => {
    if (formData.images.length === 1) {
      toast.error('At least one image is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const updateImageField = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => 
        i === index ? { ...img, [field]: value } : img
      )
    }));
  };

  const setPrimaryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    }));
  };

  // Variant Management Functions
  const addVariant = (size, color, stock) => {
    const newVariant = {
      size: size || '',
      color: color || '',
      stock: parseInt(stock) || 0,
      sku: `${formData.name.substring(0, 3).toUpperCase()}-${size}-${color}-${Date.now()}`.replace(/\s/g, '')
    };
    
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant],
      totalStock: prev.variants.reduce((sum, v) => sum + (v.stock || 0), 0) + newVariant.stock
    }));
  };

  const removeVariant = (index) => {
    setFormData(prev => {
      const updatedVariants = prev.variants.filter((_, i) => i !== index);
      return {
        ...prev,
        variants: updatedVariants,
        totalStock: updatedVariants.reduce((sum, v) => sum + (v.stock || 0), 0)
      };
    });
  };

  const updateVariant = (index, field, value) => {
    setFormData(prev => {
      const updatedVariants = prev.variants.map((v, i) => 
        i === index ? { ...v, [field]: field === 'stock' ? parseInt(value) || 0 : value } : v
      );
      return {
        ...prev,
        variants: updatedVariants,
        totalStock: updatedVariants.reduce((sum, v) => sum + (v.stock || 0), 0)
      };
    });
  };

  const addColor = (name, hex, stock) => {
    const newColor = {
      name: name || '',
      hex: hex || '#000000',
      stock: parseInt(stock) || 0
    };
    
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, newColor]
    }));
  };

  const removeColor = (index) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  const updateColor = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map((c, i) => 
        i === index ? { ...c, [field]: field === 'stock' ? parseInt(value) || 0 : value } : c
      )
    }));
  };

  // Quick variant builder for common sizes
  const buildStandardSizes = () => {
    const sizes = formData.category === 'Dress' 
      ? ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      : formData.category === 'Ornament' && formData.subcategory?.toLowerCase().includes('ring')
      ? ['5', '6', '7', '8', '9', '10']
      : [];
    
    if (sizes.length === 0) return;

    const newVariants = sizes.map(size => ({
      size,
      color: '',
      stock: 0,
      sku: `${formData.name.substring(0, 3).toUpperCase()}-${size}-${Date.now()}`.replace(/\s/g, '')
    }));

    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, ...newVariants]
    }));
    
    toast.success(`Added ${sizes.length} standard sizes`);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-midnight border border-violet-500/30 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-midnight border-b border-violet-500/30 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-2">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="Dress">Dress</option>
                <option value="Ornament">Ornament</option>
                <option value="Cosmetic">Cosmetic</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2">Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Discount Price (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.discountPrice}
                onChange={(e) => setFormData({...formData, discountPrice: e.target.value})}
                className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Stock Quantity *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.totalStock}
                onChange={(e) => setFormData({...formData, totalStock: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Material</label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({...formData, material: e.target.value})}
                className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-white mb-2">Description *</label>
            <textarea
              required
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Product Images Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-white font-medium">Product Images *</label>
              <button
                type="button"
                onClick={addImageField}
                className="flex items-center gap-2 px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm transition"
              >
                <Plus className="w-4 h-4" />
                Add Image
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.images.map((image, index) => (
                <div key={index} className="p-4 bg-midnight border border-violet-500/20 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Image {index + 1}</span>
                      {image.isPrimary && (
                        <span className="px-2 py-0.5 bg-violet-600/20 text-violet-400 text-xs rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!image.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          className="text-xs px-2 py-1 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 rounded transition"
                        >
                          Set as Primary
                        </button>
                      )}
                      {formData.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageField(index)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-gray-400 text-sm mb-1">Image URL *</label>
                      <input
                        type="url"
                        required
                        placeholder="https://example.com/image.jpg"
                        value={image.url}
                        onChange={(e) => updateImageField(index, 'url', e.target.value)}
                        className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Color Variant</label>
                      <input
                        type="text"
                        placeholder="e.g., Red, Blue"
                        value={image.color}
                        onChange={(e) => updateImageField(index, 'color', e.target.value)}
                        className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>

                  {/* Image Preview */}
                  {image.url && (
                    <div className="mt-2">
                      <img
                        src={image.url}
                        alt={`Preview ${index + 1}`}
                        className="h-32 w-32 object-cover rounded-lg border border-violet-500/30"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/150?text=Invalid+URL';
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-gray-400 text-xs">
              💡 Tip: Add multiple images for different color variants. The primary image will be shown first.
            </p>
          </div>

          {/* Size & Variants Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-white font-medium">
                {formData.category === 'Dress' && 'Sizes & Stock'}
                {formData.category === 'Ornament' && 'Variants & Stock'}
                {formData.category === 'Cosmetic' && 'Shades & Stock'}
              </label>
              <div className="flex gap-2">
                {(formData.category === 'Dress' || (formData.category === 'Ornament' && formData.subcategory?.toLowerCase().includes('ring'))) && (
                  <button
                    type="button"
                    onClick={buildStandardSizes}
                    className="text-xs px-3 py-1 bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 rounded transition"
                  >
                    Add Standard {formData.category === 'Dress' ? 'Sizes' : 'Ring Sizes'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowVariantBuilder(!showVariantBuilder)}
                  className="flex items-center gap-1 px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded transition"
                >
                  <Plus className="w-4 h-4" />
                  Add {formData.category === 'Cosmetic' ? 'Shade' : 'Variant'}
                </button>
              </div>
            </div>

            {/* Quick Add Variant Builder */}
            {showVariantBuilder && (
              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg space-y-3">
                <p className="text-white font-medium text-sm">Quick Add</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder={formData.category === 'Dress' ? 'Size (e.g., M)' : formData.category === 'Ornament' ? 'Size/Length' : 'Shade Name'}
                    id="variantSize"
                    className="px-3 py-2 bg-midnight border border-violet-500/30 text-white text-sm rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Color (optional)"
                    id="variantColor"
                    className="px-3 py-2 bg-midnight border border-violet-500/30 text-white text-sm rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    min="0"
                    id="variantStock"
                    defaultValue="0"
                    className="px-3 py-2 bg-midnight border border-violet-500/30 text-white text-sm rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const size = document.getElementById('variantSize').value;
                      const color = document.getElementById('variantColor').value;
                      const stock = document.getElementById('variantStock').value;
                      if (size) {
                        addVariant(size, color, stock);
                        document.getElementById('variantSize').value = '';
                        document.getElementById('variantColor').value = '';
                        document.getElementById('variantStock').value = '0';
                      } else {
                        toast.error('Please enter a size');
                      }
                    }}
                    className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Variants List */}
            {formData.variants.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 font-medium px-3">
                  <div className="col-span-3">Size</div>
                  <div className="col-span-3">Color</div>
                  <div className="col-span-2">Stock</div>
                  <div className="col-span-3">SKU</div>
                  <div className="col-span-1"></div>
                </div>
                {formData.variants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-midnight border border-violet-500/20 rounded-lg items-center">
                    <input
                      type="text"
                      value={variant.size}
                      onChange={(e) => updateVariant(index, 'size', e.target.value)}
                      className="col-span-3 px-2 py-1 bg-midnight border border-violet-500/30 text-white text-sm rounded"
                      placeholder="Size"
                    />
                    <input
                      type="text"
                      value={variant.color}
                      onChange={(e) => updateVariant(index, 'color', e.target.value)}
                      className="col-span-3 px-2 py-1 bg-midnight border border-violet-500/30 text-white text-sm rounded"
                      placeholder="Color"
                    />
                    <input
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                      className="col-span-2 px-2 py-1 bg-midnight border border-violet-500/30 text-white text-sm rounded"
                    />
                    <div className="col-span-3 text-xs text-gray-400 truncate">
                      {variant.sku}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="col-span-1 text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex justify-between items-center px-3 py-2 bg-violet-500/5 rounded-lg">
                  <span className="text-white font-medium">Total Stock</span>
                  <span className="text-violet-400 font-bold">{formData.totalStock}</span>
                </div>
              </div>
            )}

            {/* Helper text based on category */}
            <div className="text-gray-400 text-xs space-y-1">
              {formData.category === 'Dress' && (
                <>
                  <p>💡 <strong>For Dresses:</strong> Add sizes like XS, S, M, L, XL, XXL with stock for each.</p>
                  <p>📏 Sizes: XS (Bust 30-32"), S (32-34"), M (34-36"), L (36-38"), XL (38-40"), XXL (40-42")</p>
                </>
              )}
              {formData.category === 'Ornament' && (
                <>
                  <p>💡 <strong>For Jewelry:</strong></p>
                  <p>💍 Rings: Sizes 5-10 (US sizing)</p>
                  <p>📿 Necklaces: Chain length (e.g., 16", 18", 20")</p>
                  <p>👂 Earrings: Add colors or styles as variants</p>
                  <p>⌚ Bracelets: Lengths (e.g., 6.5", 7", 7.5")</p>
                </>
              )}
              {formData.category === 'Cosmetic' && (
                <>
                  <p>💡 <strong>For Cosmetics:</strong> Add shades/colors with stock.</p>
                  <p>💄 Example: "Ruby Red", "Pink Blush", "Nude Beige"</p>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-white mb-2">Vibe Tags</label>
            <div className="flex flex-wrap gap-2">
              {vibeOptions.map(vibe => (
                <button
                  key={vibe}
                  type="button"
                  onClick={() => toggleArrayValue('vibeTags', vibe)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    formData.vibeTags.includes(vibe)
                      ? 'bg-violet-600 text-white'
                      : 'bg-midnight border border-violet-500/30 text-gray-400 hover:text-white'
                  }`}
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>

          <div className='hidden'>
            <label className="block text-white mb-2">Undertone Compatibility</label>
            <div className="flex flex-wrap gap-2">
              {undertoneOptions.map(undertone => (
                <button
                  key={undertone}
                  type="button"
                  onClick={() => toggleArrayValue('undertoneCompatibility', undertone)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    formData.undertoneCompatibility.includes(undertone)
                      ? 'bg-pink-600 text-white'
                      : 'bg-midnight border border-violet-500/30 text-gray-400 hover:text-white'
                  }`}
                >
                  {undertone}
                </button>
              ))}
            </div>
          </div>

          {formData.category === 'Dress' && (
            <div>
              <label className="block text-white mb-2">Silhouette</label>
              <select
                value={formData.silhouette}
                onChange={(e) => setFormData({...formData, silhouette: e.target.value})}
                className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select Silhouette</option>
                {silhouetteOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          {/* ✨ Recommended For Section */}
          <div className="space-y-4 p-5 bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎯</span>
              <div>
                <h3 className="text-white font-semibold text-lg">Who is this product best for?</h3>
                <p className="text-gray-400 text-xs">Select who would love this product — this powers personalized recommendations</p>
              </div>
            </div>

            {/* Age Group */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Age Group</label>
              <div className="flex flex-wrap gap-2">
                {ageGroupOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleRecommendedFor('ageGroup', opt)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.recommendedFor.ageGroup?.includes(opt)
                        ? 'bg-purple-600 text-white'
                        : 'bg-midnight border border-violet-500/30 text-gray-400 hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Gender</label>
              <div className="flex flex-wrap gap-2">
                {genderOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleRecommendedFor('gender', opt)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.recommendedFor.gender?.includes(opt)
                        ? 'bg-pink-600 text-white'
                        : 'bg-midnight border border-violet-500/30 text-gray-400 hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Body Type */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Body Type</label>
              <div className="flex flex-wrap gap-2">
                {bodyTypeOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleRecommendedFor('bodyType', opt)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.recommendedFor.bodyType?.includes(opt)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-midnight border border-violet-500/30 text-gray-400 hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Skin Tone */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Skin Tone</label>
              <div className="flex flex-wrap gap-2">
                {skinToneTargetOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleRecommendedFor('skinTone', opt)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.recommendedFor.skinTone?.includes(opt)
                        ? 'bg-amber-600 text-white'
                        : 'bg-midnight border border-violet-500/30 text-gray-400 hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-gray-500 text-xs">
              💡 Tip: Select "All Ages", "Unisex", "All Body Types", or "All Skin Tones" to make this product visible to everyone in that category.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-violet-500/30">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg hover:bg-violet-500/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProducts;
