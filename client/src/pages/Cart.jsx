import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, updateCartQuantity, removeFromCart, isAuthenticated } = useStore();
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    calculateTotals();
  }, [cart]);

  const calculateTotals = () => {
    const sub = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = sub * 0.18; // 18% GST
    const shippingCost = sub > 1000 ? 0 : 50; // Free shipping above ₹1000
    const totalAmount = sub + taxAmount + shippingCost;

    setSubtotal(sub);
    setTax(taxAmount);
    setShipping(shippingCost);
    setTotal(totalAmount);
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity > 10) {
      toast.error('Maximum 10 items allowed');
      return;
    }
    updateCartQuantity(item.id, item.size, item.color, newQuantity);
  };

  const handleRemove = (item) => {
    removeFromCart(item.id, item.size, item.color);
    toast.success('Item removed from cart');
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to continue');
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-midnight py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center bg-midnight border border-violet-500/30 rounded-xl p-12">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-violet-600/20 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-violet-400" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Your Cart is Empty</h2>
            <p className="text-gray-400 mb-8">
              Looks like you haven't added anything to your cart yet. Start exploring our collection!
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-lg transition font-semibold flex items-center gap-2 mx-auto"
            >
              <Sparkles className="w-5 h-5" />
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={`${item.id}-${item.size}-${item.color}`}
                className="bg-midnight border border-violet-500/30 rounded-xl p-4 flex gap-4"
              >
                {/* Product Image */}
                <img
                  src={item.image || '/assets/images/placeholders/product-placeholder.jpg'}
                  alt={item.name}
                  loading="lazy"
                  className="w-24 h-24 object-cover rounded-lg"
                />

                {/* Product Details */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>
                  <div className="flex gap-4 text-sm text-gray-400 mb-3">
                    {item.size && <span>Size: {item.size}</span>}
                    {item.color && <span>Color: {item.color}</span>}
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-midnight border border-violet-500/30 text-white rounded hover:bg-violet-600 transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center text-white font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-midnight border border-violet-500/30 text-white rounded hover:bg-violet-600 transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400">
                        ₹{item.price} each
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(item)}
                  className="text-red-400 hover:text-red-300 transition self-start"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-midnight border border-violet-500/30 rounded-xl p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal ({cart.length} items)</span>
                  <span className="text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tax (GST 18%)</span>
                  <span className="text-white">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className="text-white">
                    {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
                  </span>
                </div>
                {subtotal < 1000 && (
                  <p className="text-sm text-amber-400">
                    Add ₹{(1000 - subtotal).toFixed(2)} more for FREE shipping!
                  </p>
                )}
              </div>

              <div className="border-t border-violet-500/30 pt-4 mb-6">
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate('/products')}
                className="w-full mt-3 bg-transparent border border-violet-500/30 hover:border-violet-500 text-white py-3 rounded-lg transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
