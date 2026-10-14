import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { isLoggedIn } from '../utils/auth';
import toast from '../utils/toast';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import {
  FiStar,
  FiShoppingCart,
  FiPlus,
  FiMinus,
  FiTruck,
  FiShield,
  FiSparkles,
  FiCheckCircle,
} from '../components/icons';
import './ProductDetail.css';

function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [frequentlyBought, setFrequentlyBought] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProductDetails();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch main product by slug or id
      let prodData;
      try {
        const res = await api.get(`/products/${slug}/`);
        prodData = res.data;
      } catch (e) {
        // Fallback: in case slug is textual and backend expects id, search product by slug
        const searchRes = await api.get(`/products/?search=${encodeURIComponent(slug)}`);
        const items = searchRes.data.results || searchRes.data;
        if (Array.isArray(items) && items.length > 0) {
          const matched =
            items.find((p) => p.slug === slug || String(p.id) === String(slug)) ||
            items[0];
          const fullRes = await api.get(`/products/${matched.id}/`);
          prodData = fullRes.data;
        } else {
          throw e;
        }
      }
      setProduct(prodData);

      // 2. Fetch similar products (AI recommendation endpoint)
      try {
        const simRes = await api.get(
          `/recommendations/similar/${prodData.id || slug}/`
        );
        const simData = simRes.data.results || simRes.data;
        setSimilarProducts(Array.isArray(simData) ? simData.slice(0, 4) : []);
      } catch (e) {
        // Fallback: load general products
        try {
          const fallbackRes = await api.get('/products/');
          const fbData = fallbackRes.data.results || fallbackRes.data;
          if (Array.isArray(fbData)) {
            setSimilarProducts(
              fbData.filter((p) => p.id !== prodData.id).slice(0, 4)
            );
          }
        } catch (errFallback) {
          setSimilarProducts([]);
        }
      }

      // 3. Fetch frequently bought together
      try {
        const fbtRes = await api.get(
          `/recommendations/frequently-bought/${prodData.id || slug}/`
        );
        const fbtData = fbtRes.data.results || fbtRes.data;
        setFrequentlyBought(Array.isArray(fbtData) ? fbtData.slice(0, 2) : []);
      } catch (e) {
        // Fallback: take next 2 products
        try {
          const fallbackRes = await api.get('/products/');
          const fbData = fallbackRes.data.results || fallbackRes.data;
          if (Array.isArray(fbData)) {
            setFrequentlyBought(
              fbData.filter((p) => p.id !== prodData.id).slice(0, 2)
            );
          }
        } catch (errFallback) {
          setFrequentlyBought([]);
        }
      }

      // 4. Fetch reviews (embedded in product or from /products/reviews/?product=<id>)
      if (
        prodData.reviews &&
        Array.isArray(prodData.reviews) &&
        prodData.reviews.length > 0
      ) {
        setReviews(prodData.reviews);
      } else {
        try {
          const revRes = await api.get(`/products/reviews/?product=${prodData.id}`);
          const revData = revRes.data.results || revRes.data;
          setReviews(
            Array.isArray(revData) ? revData : prodData.reviews || []
          );
        } catch (e) {
          setReviews(prodData.reviews || []);
        }
      }
    } catch (err) {
      console.error('Failed to load product detail:', err);
      toast.error('Product not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (goToCheckout = false) => {
    if (!isLoggedIn()) {
      toast.error('Please sign in to add items to your cart.');
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    try {
      await api.post('/cart/add/', {
        product_id: product.id,
        quantity: quantity,
      });

      window.dispatchEvent(new Event('cartUpdated'));
      toast.success(
        `Added ${quantity} × ${product.title || product.name} to cart!`
      );

      if (goToCheckout) {
        navigate('/cart');
      }
    } catch (err) {
      console.error('Cart add error:', err);
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to add item to cart.'
      );
    } finally {
      setAddingToCart(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) {
      toast.error('Please sign in to leave a review.');
      navigate('/login');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.post('/products/reviews/', {
        product: product.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast.success('Review submitted successfully! Thank you for your feedback.');
      setReviews([res.data, ...reviews]);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      console.error('Review submit error:', err);
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to submit review.'
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <Loader message="Loading product information..." />;
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Product not found</h2>
        <p>The product you are looking for might have been removed or does not exist.</p>
        <Link to="/products" className="browse-now-btn">
          Back to Products
        </Link>
      </div>
    );
  }

  const discountPrice = product.discount_price
    ? Number(product.discount_price)
    : null;
  const originalPrice = Number(product.price);
  const hasDiscount = discountPrice && discountPrice < originalPrice;
  const effectivePrice = hasDiscount ? discountPrice : originalPrice;
  const rating = Number(product.rating || product.average_rating || 4.5);
  const imageUrl =
    product.image_url ||
    product.image ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80';

  // Calculate bundle price with frequently bought together
  const bundleTotal =
    effectivePrice +
    frequentlyBought.reduce((acc, item) => {
      const itemPrice = item.discount_price
        ? Number(item.discount_price)
        : Number(item.price);
      return acc + (itemPrice || 0);
    }, 0);

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        {/* Left Side: Images */}
        <div className="product-gallery">
          <div className="main-image-wrapper">
            <img
              src={imageUrl}
              alt={product.title || product.name}
              className="product-main-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80';
              }}
            />
            <div className="ai-curated-badge-large">
              <FiSparkles size={16} />
              <span>AI Verified Authentic</span>
            </div>
          </div>
        </div>

        {/* Right Side: Info & Actions */}
        <div className="product-info-panel">
          {product.category && (
            <span className="product-category-crumb">
              {typeof product.category === 'object'
                ? product.category.name
                : product.category}
            </span>
          )}

          <h1 className="product-detail-title">
            {product.title || product.name}
          </h1>

          {/* Rating */}
          <div className="product-rating-box">
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  size={18}
                  color={star <= Math.round(rating) ? '#f59e0b' : '#d1d5db'}
                  fill={star <= Math.round(rating) ? '#f59e0b' : 'none'}
                />
              ))}
            </div>
            <span className="rating-score">{rating.toFixed(1)}</span>
            <span className="rating-divider">•</span>
            <span className="reviews-link">{reviews.length} Customer Reviews</span>
          </div>

          {/* Pricing */}
          <div className="product-price-section">
            <div className="price-display">
              <span className="current-price-large">
                ₹{effectivePrice.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <>
                  <span className="original-price-large">
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="discount-tag-large">
                    {Math.round(
                      ((originalPrice - discountPrice) / originalPrice) * 100
                    )}
                    % OFF
                  </span>
                </>
              )}
            </div>
            <p className="tax-inclusive-text">Inclusive of all taxes</p>
          </div>

          {/* Description */}
          <div className="product-description-box">
            <h3>About this item</h3>
            <p>
              {product.description ||
                'No description available for this product.'}
            </p>
          </div>

          {/* Stock status */}
          <div className="stock-status">
            {(product.stock ?? 10) > 0 ? (
              <span className="in-stock-label">
                <FiCheckCircle size={16} color="#16a34a" /> In Stock & Ready to Ship
              </span>
            ) : (
              <span className="out-of-stock-label">Currently Out of Stock</span>
            )}
          </div>

          {/* Quantity & CTA buttons */}
          <div className="purchase-controls">
            <div className="quantity-selector">
              <button
                className="qty-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <FiMinus size={14} />
              </button>
              <span className="qty-number">{quantity}</span>
              <button
                className="qty-btn"
                onClick={() => setQuantity(quantity + 1)}
              >
                <FiPlus size={14} />
              </button>
            </div>

            <button
              className="add-to-cart-btn"
              onClick={() => handleAddToCart(false)}
              disabled={addingToCart || (product.stock ?? 10) <= 0}
            >
              <FiShoppingCart size={18} />
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>

            <button
              className="buy-now-btn"
              onClick={() => handleAddToCart(true)}
              disabled={addingToCart || (product.stock ?? 10) <= 0}
            >
              Buy Now
            </button>
          </div>

          {/* Guarantees */}
          <div className="value-props">
            <div className="prop-item">
              <FiTruck size={20} color="#4b5563" />
              <div>
                <strong>Free Delivery</strong>
                <p>On all orders above ₹499</p>
              </div>
            </div>
            <div className="prop-item">
              <FiShield size={20} color="#4b5563" />
              <div>
                <strong>Secure Payments</strong>
                <p>Protected by Razorpay 256-bit SSL</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together */}
      {frequentlyBought.length > 0 && (
        <section className="detail-section frequently-bought-section">
          <h2 className="section-title">Frequently Bought Together</h2>
          <div className="bundle-card">
            <div className="bundle-items-preview">
              <div className="bundle-item-thumbnail">
                <img src={imageUrl} alt={product.title} />
              </div>
              {frequentlyBought.map((item) => (
                <React.Fragment key={item.id}>
                  <span className="bundle-plus">+</span>
                  <div className="bundle-item-thumbnail">
                    <img
                      src={item.image_url || item.image}
                      alt={item.title}
                    />
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div className="bundle-pricing-action">
              <div className="bundle-price-info">
                <span className="bundle-total-label">Bundle Price:</span>
                <span className="bundle-total-amount">
                  ₹{bundleTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <button
                className="bundle-add-btn"
                onClick={async () => {
                  if (!isLoggedIn()) {
                    toast.error('Please sign in first.');
                    navigate('/login');
                    return;
                  }
                  try {
                    await api.post('/cart/add/', {
                      product_id: product.id,
                      quantity: 1,
                    });
                    for (const item of frequentlyBought) {
                      await api.post('/cart/add/', {
                        product_id: item.id,
                        quantity: 1,
                      });
                    }
                    window.dispatchEvent(new Event('cartUpdated'));
                    toast.success('Added full bundle to your cart!');
                  } catch (e) {
                    toast.error('Failed to add bundle to cart.');
                  }
                }}
              >
                Add All to Cart
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Similar Products (AI Recommended) */}
      {similarProducts.length > 0 && (
        <section className="detail-section">
          <div className="section-header">
            <div className="title-with-badge">
              <FiSparkles className="section-icon sparkles-color" size={20} />
              <h2 className="section-title">Similar Products Curated by AI</h2>
            </div>
          </div>
          <div className="similar-products-grid">
            {similarProducts.map((p) => (
              <ProductCard key={p.id || p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Customer Reviews & Add Review Form */}
      <section className="detail-section reviews-section">
        <h2 className="section-title">Customer Reviews & Ratings</h2>

        {/* Add Review Form */}
        <div className="add-review-card">
          <h3>Leave a Review</h3>
          <form onSubmit={handleReviewSubmit} className="review-form">
            <div className="review-rating-select">
              <label>Your Rating:</label>
              <div className="star-rating-picker">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="star-pick-btn"
                    onClick={() =>
                      setReviewForm({ ...reviewForm, rating: star })
                    }
                  >
                    <FiStar
                      size={22}
                      color={star <= reviewForm.rating ? '#f59e0b' : '#d1d5db'}
                      fill={star <= reviewForm.rating ? '#f59e0b' : 'none'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="review-comment-field">
              <textarea
                placeholder="Share your experience with this product..."
                rows={3}
                value={reviewForm.comment}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, comment: e.target.value })
                }
                required
              />
            </div>

            <button
              type="submit"
              className="submit-review-btn"
              disabled={submittingReview}
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>

        {/* Reviews List */}
        <div className="reviews-list">
          {reviews.length > 0 ? (
            reviews.map((rev, index) => (
              <div key={rev.id || index} className="review-item-card">
                <div className="review-item-header">
                  <span className="reviewer-name">
                    {rev.user?.full_name || rev.user_name || 'Verified Buyer'}
                  </span>
                  <div className="review-item-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FiStar
                        key={s}
                        size={14}
                        color={s <= rev.rating ? '#f59e0b' : '#d1d5db'}
                        fill={s <= rev.rating ? '#f59e0b' : 'none'}
                      />
                    ))}
                  </div>
                </div>
                <p className="review-item-comment">{rev.comment}</p>
                <span className="review-item-date">
                  {rev.created_at
                    ? new Date(rev.created_at).toLocaleDateString()
                    : 'Recent'}
                </span>
              </div>
            ))
          ) : (
            <p className="no-reviews-text">
              No reviews yet. Be the first to review this product!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default ProductDetail;
