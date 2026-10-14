import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiChevronDown, FiLogOut, FiPackage, FiEdit } from './icons';
import { getUser, isLoggedIn, isSeller, logout } from '../utils/auth';
import api from '../utils/api';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(getUser());
  const [cartCount, setCartCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(getUser());
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  useEffect(() => {
    // Fetch cart count if logged in
    const fetchCartCount = async () => {
      if (isLoggedIn()) {
        try {
          const res = await api.get('/cart/');
          if (res.data && res.data.items) {
            const count = res.data.items.reduce((acc, item) => acc + (item.quantity || 1), 0);
            setCartCount(count);
          }
        } catch (err) {
          // If 404 or empty cart, ignore
        }
      } else {
        setCartCount(0);
      }
    };

    fetchCartCount();
    window.addEventListener('cartUpdated', fetchCartCount);
    return () => window.removeEventListener('cartUpdated', fetchCartCount);
  }, [currentUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo & Name */}
        <Link to="/" className="navbar-brand">
          <img src="/logo.jpg" alt="Logo" className="navbar-logo-img" />
          <span className="navbar-brand-title">AI Powered Ecommerce</span>
        </Link>

        {/* Search Bar */}
        <form className="navbar-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search products, brands and more..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="navbar-search-btn" aria-label="Search">
            <FiSearch size={18} />
          </button>
        </form>

        {/* Nav Actions */}
        <div className="navbar-actions">
          {/* Explore Products link */}
          <Link to="/products" className="navbar-link">
            Explore
          </Link>

          {/* User Account / Login */}
          {currentUser ? (
            <div
              className="navbar-user-dropdown"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button
                className="user-dropdown-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="user-avatar">
                  <FiUser size={16} />
                </div>
                <span className="user-name">
                  {currentUser.full_name?.split(' ')[0] || 'Account'}
                </span>
                <FiChevronDown size={14} />
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <p className="dropdown-user-name">{currentUser.full_name}</p>
                    <p className="dropdown-user-email">{currentUser.email}</p>
                    <span className="dropdown-role-badge">{currentUser.role}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FiUser size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/my-orders"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FiPackage size={16} />
                    <span>My Orders</span>
                  </Link>
                  {isSeller() && (
                    <Link
                      to="/seller/dashboard"
                      className="dropdown-item seller-highlight"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FiEdit size={16} />
                      <span>Seller Dashboard</span>
                    </Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    <FiLogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="navbar-login-btn">
              Sign In
            </Link>
          )}

          {/* Cart Icon */}
          <Link to="/cart" className="navbar-cart-btn" aria-label="Cart">
            <div className="cart-icon-wrapper">
              <FiShoppingCart size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </div>
            <span className="cart-label">Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
