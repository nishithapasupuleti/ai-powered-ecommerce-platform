import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        <div className="footer-column brand-col">
          <div className="footer-brand">
            <img src="/logo.jpg" alt="Logo" className="footer-logo-img" />
            <h4 className="footer-brand-title">AI Powered Ecommerce</h4>
          </div>
          <p className="footer-desc">
            Next-generation shopping driven by intelligent algorithms, personalized recommendations, and seamless checkout experience.
          </p>
        </div>

        <div className="footer-column">
          <h5 className="footer-col-title">Shop</h5>
          <ul className="footer-links">
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/products?category=Electronics">Electronics</Link></li>
            <li><Link to="/products?category=Fashion">Fashion</Link></li>
            <li><Link to="/products?category=Home & Kitchen">Home & Kitchen</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h5 className="footer-col-title">Account</h5>
          <ul className="footer-links">
            <li><Link to="/profile">My Profile</Link></li>
            <li><Link to="/my-orders">Order History</Link></li>
            <li><Link to="/cart">Shopping Cart</Link></li>
            <li><Link to="/register">Become a Seller</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h5 className="footer-col-title">About</h5>
          <ul className="footer-links">
            <li><a href="#about">About Us</a></li>
            <li><a href="#contact">Contact Support</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#terms">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>AI Powered Ecommerce Platform © 2026. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
