import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { isLoggedIn } from '../utils/auth';
import toast from '../utils/toast';
import Loader from '../components/Loader';
import {
  FiTrash2,
  FiPlus,
  FiMinus,
  FiArrowRight,
  FiShoppingCart,
  FiShield,
  FiTag,
  FiCheckCircle,
} from '../components/icons';
import './Cart.css';

function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      toast.error('Please sign in to view your shopping cart.');
      navigate('/login');
      return;
    }
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cart/');
      setCart(res.data);
    } catch (err) {
      console.error('Failed to load cart:', err);
      setCart({ items: [], total_price: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    setUpdatingId(itemId);
    try {
      await api.put(`/cart/update/${itemId}/`, { quantity: newQty });
      await fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      toast.error('Failed to update quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setUpdatingId(itemId);
    try {
      await api.delete(`/cart/remove/${itemId}/`);
      await fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success('Item removed from cart.');
    } catch (err) {
      toast.error('Failed to remove item.');
    } finally {
      setUpdatingId(null);
    }
  };

  const items = cart?.items || [];
  const subtotal = items.reduce((acc, item) => {
    const p = item.product;
    const price = p?.discount_price ? Number(p.discount_price) : Number(p?.price || 0);
    return acc + price * (item.quantity || 1);
  }, 0);

  const discountTotal = items.reduce((acc, item) => {
    const p = item.product;
    if (p?.discount_price && Number(p.discount_price) < Number(p.price)) {
      return acc + (Number(p.price) - Number(p.discount_price)) * (item.quantity || 1);
    }
    return acc;
  }, 0);

  const couponDiscount = appliedCoupon ? Number(appliedCoupon.discount_amount || 0) : 0;
  const shipping = subtotal > 499 || subtotal === 0 ? 0 : 50;
  const finalTotal = Math.max(0, subtotal - couponDiscount + shipping);

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponCode).trim();
    if (!code) {
      toast.error('Please enter a coupon code.');
      return;
    }

    setApplyingCoupon(true);
    try {
      const res = await api.post('/coupons/apply/', {
        code: code,
        order_total: subtotal,
      });

      const discount =
        res.data.discount_amount ??
        res.data.discount ??
        res.data.discount_value ??
        0;

      const couponObj = {
        code: (res.data.code || code).toUpperCase(),
        discount_amount: Number(discount),
      };

      setAppliedCoupon(couponObj);
      localStorage.setItem('applied_coupon', JSON.stringify(couponObj));
      setCouponCode('');
      toast.success(res.data.message || `Coupon ${couponObj.code} applied! Saved ₹${discount}`);
    } catch (err) {
      console.error('Failed to apply coupon:', err);
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Invalid or expired coupon code.'
      );
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem('applied_coupon');
    toast.success('Coupon removed.');
  };

  const handleToggleAvailableCoupons = async () => {
    const willShow = !showAvailableCoupons;
    setShowAvailableCoupons(willShow);

    if (willShow && availableCoupons.length === 0) {
      setLoadingCoupons(true);
      try {
        const res = await api.get('/coupons/available/');
        const list =
          res.data.coupons ||
          res.data.results ||
          (Array.isArray(res.data) ? res.data : []);
        setAvailableCoupons(list);
      } catch (err) {
        console.error('Failed to fetch available coupons:', err);
        // Fallback default coupons for user experience
        setAvailableCoupons([
          {
            code: 'WELCOME10',
            description: '10% off on your order',
            discount_value: '10%',
          },
          {
            code: 'SAVE50',
            description: 'Flat ₹50 off on orders above ₹499',
            discount_value: '₹50',
          },
          {
            code: 'FESTIVE100',
            description: 'Flat ₹100 off on orders above ₹999',
            discount_value: '₹100',
          },
        ]);
      } finally {
        setLoadingCoupons(false);
      }
    }
  };

  if (loading) {
    return <Loader message="Loading your cart..." />;
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1 className="cart-page-title">
          Shopping Cart ({items.reduce((acc, i) => acc + (i.quantity || 1), 0)} items)
        </h1>

        {items.length === 0 ? (
          <div className="empty-cart-card">
            <div className="empty-cart-icon">
              <FiShoppingCart size={48} color="#9ca3af" />
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <Link to="/products" className="continue-shopping-btn">
              Continue Shopping <FiArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Cart Items List */}
            <div className="cart-items-list">
              {items.map((item) => {
                const prod = item.product || {};
                const discPrice = prod.discount_price ? Number(prod.discount_price) : null;
                const origPrice = Number(prod.price || 0);
                const hasDiscount = discPrice && discPrice < origPrice;
                const currentPrice = hasDiscount ? discPrice : origPrice;
                const img =
                  prod.image_url ||
                  prod.image ||
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80';

                return (
                  <div key={item.id} className="cart-item-card">
                    <Link
                      to={`/products/${prod.slug || prod.id}`}
                      className="cart-item-image-link"
                    >
                      <img
                        src={img}
                        alt={prod.title || prod.name}
                        className="cart-item-img"
                      />
                    </Link>

                    <div className="cart-item-details">
                      <Link
                        to={`/products/${prod.slug || prod.id}`}
                        className="cart-item-title"
                      >
                        {prod.title || prod.name}
                      </Link>

                      <div className="cart-item-prices">
                        <span className="cart-item-price">
                          ₹{currentPrice.toLocaleString('en-IN')}
                        </span>
                        {hasDiscount && (
                          <span className="cart-item-orig-price">
                            ₹{origPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <div className="cart-item-actions">
                        <div className="cart-qty-control">
                          <button
                            className="cart-qty-btn"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity, -1)
                            }
                            disabled={updatingId === item.id}
                            title="Decrease quantity"
                          >
                            <FiMinus size={13} />
                          </button>
                          <span className="cart-qty-val">{item.quantity}</span>
                          <button
                            className="cart-qty-btn"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity, 1)
                            }
                            disabled={updatingId === item.id}
                            title="Increase quantity"
                          >
                            <FiPlus size={13} />
                          </button>
                        </div>

                        <button
                          className="cart-remove-btn"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={updatingId === item.id}
                        >
                          <FiTrash2 size={15} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-total">
                      ₹{(currentPrice * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Details Sidebar */}
            <div className="cart-summary-sidebar">
              <div className="summary-card">
                <h3 className="summary-title">Order Summary</h3>

                {/* Coupon Code Section */}
                <div className="cart-coupon-section">
                  {appliedCoupon ? (
                    <div className="applied-coupon-box">
                      <div className="applied-coupon-info">
                        <span className="applied-coupon-badge">
                          <FiCheckCircle size={14} color="#16a34a" /> {appliedCoupon.code}
                        </span>
                        <span className="applied-coupon-amount">
                          -₹{couponDiscount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="remove-coupon-btn"
                        onClick={handleRemoveCoupon}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="coupon-input-group">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        className="coupon-input"
                        disabled={applyingCoupon}
                      />
                      <button
                        type="button"
                        className="coupon-apply-btn"
                        onClick={() => handleApplyCoupon()}
                        disabled={applyingCoupon || !couponCode.trim()}
                      >
                        {applyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}

                  {/* Toggle Available Coupons */}
                  <button
                    type="button"
                    className="toggle-available-coupons-btn"
                    onClick={handleToggleAvailableCoupons}
                  >
                    <FiTag size={14} />
                    <span>
                      {showAvailableCoupons
                        ? 'Hide Available Coupons'
                        : 'View Available Coupons'}
                    </span>
                  </button>

                  {/* Available Coupons Dropdown / List */}
                  {showAvailableCoupons && (
                    <div className="available-coupons-list">
                      {loadingCoupons ? (
                        <p className="coupons-loading-text">Loading coupons...</p>
                      ) : availableCoupons.length > 0 ? (
                        availableCoupons.map((c, idx) => (
                          <div key={c.code || idx} className="available-coupon-item">
                            <div className="coupon-item-details">
                              <span className="coupon-item-code">{c.code}</span>
                              <p className="coupon-item-desc">
                                {c.description ||
                                  (c.discount_value
                                    ? `Save ${c.discount_value}`
                                    : 'Special discount')}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="coupon-item-action-btn"
                              onClick={() => handleApplyCoupon(c.code)}
                              disabled={appliedCoupon?.code === c.code || applyingCoupon}
                            >
                              {appliedCoupon?.code === c.code ? 'Applied' : 'Apply'}
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="no-coupons-text">No coupons available right now.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row">
                  <span>Price ({items.length} items)</span>
                  <span>₹{(subtotal + discountTotal).toLocaleString('en-IN')}</span>
                </div>

                {discountTotal > 0 && (
                  <div className="summary-row discount-row">
                    <span>Product Discount</span>
                    <span>-₹{discountTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {appliedCoupon && couponDiscount > 0 && (
                  <div className="summary-row discount-row coupon-discount-row">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="summary-row">
                  <span>Delivery Charges</span>
                  <span>
                    {shipping === 0 ? (
                      <strong className="free-text">FREE</strong>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row total-row">
                  <span>Total Amount</span>
                  <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>

                {discountTotal + couponDiscount > 0 && (
                  <p className="savings-badge">
                    You will save ₹{(discountTotal + couponDiscount).toLocaleString('en-IN')}{' '}
                    on this order!
                  </p>
                )}

                <button
                  className="checkout-proceed-btn"
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout <FiArrowRight size={18} />
                </button>

                <div className="summary-guarantee">
                  <FiShield size={16} color="#6b7280" />
                  <span>Safe and Secure Payments. Easy returns.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
