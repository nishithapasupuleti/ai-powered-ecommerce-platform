import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { isLoggedIn } from '../utils/auth';
import toast from '../utils/toast';
import Loader from '../components/Loader';
import { FiPackage, FiChevronDown, FiChevronRight, FiClock } from '../components/icons';
import './MyOrders.css';

function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      toast.error('Please sign in to view your orders.');
      navigate('/login');
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/');
      const data = res.data.results || res.data;
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    let badgeClass = 'status-pending';
    let label = 'Pending';

    if (s === 'confirmed') {
      badgeClass = 'status-confirmed';
      label = 'Confirmed';
    } else if (s === 'shipped') {
      badgeClass = 'status-shipped';
      label = 'Shipped';
    } else if (s === 'delivered') {
      badgeClass = 'status-delivered';
      label = 'Delivered';
    } else if (s === 'cancelled') {
      badgeClass = 'status-cancelled';
      label = 'Cancelled';
    }

    return <span className={`order-status-badge ${badgeClass}`}>{label}</span>;
  };

  if (loading) {
    return <Loader message="Fetching your order history..." />;
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <h1 className="orders-title">My Orders</h1>

        {orders.length === 0 ? (
          <div className="empty-orders-card">
            <FiPackage size={48} color="#9ca3af" />
            <h2>No orders yet</h2>
            <p>You haven't placed any orders yet. Discover our curated collection today!</p>
            <Link to="/products" className="shop-now-btn">Start Shopping</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const dateStr = order.created_at
                ? new Date(order.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Recent';

              return (
                <div key={order.id} className="order-card">
                  <div className="order-card-header" onClick={() => toggleExpand(order.id)}>
                    <div className="order-header-info">
                      <div className="order-id-date">
                        <span className="order-id">Order #{order.id}</span>
                        <span className="order-date">
                          <FiClock size={12} /> {dateStr}
                        </span>
                      </div>
                      <div className="order-header-right">
                        {getStatusBadge(order.status)}
                        <span className="order-amount">
                          ₹{Number(order.total_amount || 0).toLocaleString('en-IN')}
                        </span>
                        <button className="expand-chevron-btn" aria-label="Expand order">
                          {isExpanded ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Items */}
                  {isExpanded && (
                    <div className="order-items-expansion">
                      <h4 className="expansion-subtitle">Items in this order:</h4>
                      <div className="order-items-grid">
                        {(order.items || []).map((item) => {
                          const prod = item.product || {};
                          const img = prod.image_url || prod.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';

                          return (
                            <div key={item.id} className="order-item-card">
                              <img src={img} alt={prod.title || 'Product'} className="order-item-img" />
                              <div className="order-item-info">
                                <Link to={`/products/${prod.slug || prod.id}`} className="order-item-title">
                                  {prod.title || prod.name}
                                </Link>
                                <div className="order-item-meta">
                                  <span>Qty: {item.quantity}</span>
                                  <span>•</span>
                                  <span>₹{Number(item.price || 0).toLocaleString('en-IN')} each</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {order.shipping_address && (
                        <div className="order-shipping-summary">
                          <strong>Delivery Address:</strong>
                          <p>
                            {typeof order.shipping_address === 'string'
                              ? order.shipping_address
                              : `${order.shipping_address.full_name || ''}, ${order.shipping_address.address_line || ''}, ${order.shipping_address.city || ''} - ${order.shipping_address.pincode || ''}`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
