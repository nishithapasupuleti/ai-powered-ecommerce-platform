import React from 'react';
import { Link } from 'react-router-dom';
import { FiStar } from './icons';
import './ProductCard.css';

function ProductCard({ product }) {
  if (!product) return null;

  const discountPrice = product.discount_price ? Number(product.discount_price) : null;
  const originalPrice = Number(product.price);
  const hasDiscount = discountPrice && discountPrice < originalPrice;
  const rating = Number(product.rating || product.average_rating || 4.5);
  const imageUrl = product.image_url || product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80';
  const slug = product.slug || product.id;

  return (
    <div className="product-card">
      <Link to={`/products/${slug}`} className="product-card-link">
        <div className="product-image-container">
          <img
            src={imageUrl}
            alt={product.title || product.name}
            className="product-card-img"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80';
            }}
          />
          {hasDiscount && (
            <div className="discount-badge">
              {Math.round(((originalPrice - discountPrice) / originalPrice) * 100)}% OFF
            </div>
          )}
        </div>

        <div className="product-card-info">
          {product.category && (
            <span className="product-category-tag">
              {typeof product.category === 'object' ? product.category.name : product.category}
            </span>
          )}
          <h3 className="product-title" title={product.title || product.name}>
            {product.title || product.name}
          </h3>

          <div className="product-rating">
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  size={14}
                  color={star <= Math.round(rating) ? '#f59e0b' : '#d1d5db'}
                  fill={star <= Math.round(rating) ? '#f59e0b' : 'none'}
                />
              ))}
            </div>
            <span className="rating-value">{rating.toFixed(1)}</span>
            {product.reviews_count !== undefined && (
              <span className="reviews-count">({product.reviews_count})</span>
            )}
          </div>

          <div className="product-price-row">
            <span className="current-price">
              ₹{(hasDiscount ? discountPrice : originalPrice).toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <span className="original-price">
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ProductCard;
