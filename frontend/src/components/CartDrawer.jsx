import React from "react";

export default function CartDrawer({
  cart = [],
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout
}) {
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
    0
  );

  const deliveryFee = subtotal >= 299 || subtotal === 0 ? 0 : 40;
  const taxes = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + deliveryFee + taxes;

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="polished-cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div className="cart-header-title">
            <h2>🛒 Your Food Bag</h2>
            <span className="cart-item-count-badge">
              {cart.reduce((total, item) => total + (item.quantity || 1), 0)} items
            </span>
          </div>

          <button className="cart-close-x-btn" onClick={onClose} aria-label="Close cart">
            ×
          </button>
        </div>

        {cart.length === 0 ? (
          /* ========================================================
             POLISHED EMPTY CART STATE (RULE 41)
             ======================================================== */
          <div className="empty-cart-container">
            <div className="empty-cart-illustration">
              <span className="empty-cart-icon">🍲</span>
              <div className="empty-cart-glow"></div>
            </div>

            <h3>Your cart is empty & hungry</h3>
            <p className="empty-cart-msg">
              Good food is always cooking! Discover authentic Hyderabadi Biryani, crisp Dosas,
              and nutritious protein bowls.
            </p>

            <button
              className="continue-shopping-cta-btn"
              onClick={() => {
                onClose();
                const foodsSection = document.getElementById("foods");
                foodsSection?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Explore Hyderabad Food Menu ➔
            </button>

            <div className="empty-cart-perks">
              <div className="perk-item">
                <span>⚡</span>
                <small>Lightning Fast 30-min Delivery</small>
              </div>
              <div className="perk-item">
                <span>🥗</span>
                <small>Dietitian Certified Macros</small>
              </div>
              <div className="perk-item">
                <span>🛡️</span>
                <small>100% Hygienic FoodTech Packaging</small>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
             ACTIVE POPULATED CART EXPERIENCE
             ======================================================== */
          <div className="cart-drawer-content">
            {/* Free Delivery Progress Bar */}
            <div className="free-delivery-banner">
              {subtotal >= 299 ? (
                <div className="free-delivery-unlocked">
                  <span>🎉</span>
                  <strong>FREE Delivery Unlocked!</strong>
                </div>
              ) : (
                <div className="free-delivery-progress">
                  <span>🛵</span>
                  <span>
                    Add <strong>₹{299 - subtotal}</strong> more to get <strong>FREE delivery</strong>
                  </span>
                </div>
              )}
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(100, (subtotal / 299) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="cart-items-scroll-list">
              {cart.map((item, index) => (
                <div className="cart-item-card" key={item.food_id || index}>
                  <div className="cart-item-thumb-box">
                    <img
                      src={item.image_url}
                      alt={item.food_name}
                      className="cart-item-img"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80";
                      }}
                    />
                    <span className={item.is_vegetarian ? "veg-corner-dot" : "nonveg-corner-dot"}>
                      {item.is_vegetarian ? "🟢" : "🔴"}
                    </span>
                  </div>

                  <div className="cart-item-details">
                    <div className="cart-item-name-row">
                      <h4>{item.food_name}</h4>
                      <button
                        className="cart-trash-btn"
                        onClick={() => onRemoveItem(item.food_id)}
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        🗑️
                      </button>
                    </div>

                    <span className="cart-item-unit-price">₹{item.price} each</span>

                    <div className="cart-item-bottom-row">
                      {/* Polished Stepper */}
                      <div className="cart-stepper">
                        <button
                          onClick={() => onUpdateQuantity(item.food_id, -1)}
                          title="Decrease"
                        >
                          −
                        </button>
                        <span>{item.quantity || 1}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.food_id, 1)}
                          title="Increase"
                        >
                          +
                        </button>
                      </div>

                      <strong className="cart-item-total-price">
                        ₹{Number(item.price || 0) * (item.quantity || 1)}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping Action */}
            <button
              className="continue-browsing-link-btn"
              onClick={() => {
                onClose();
                const foodsSection = document.getElementById("foods");
                foodsSection?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              + Add More Dishes
            </button>

            {/* Bill Summary Breakdown */}
            <div className="cart-bill-section">
              <h4>Bill Summary</h4>
              <div className="bill-line">
                <span>Item Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="bill-line">
                <span>Delivery Partner Fee</span>
                <span>
                  {deliveryFee === 0 ? (
                    <strong className="free-text">FREE</strong>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>
              <div className="bill-line">
                <span>Govt Taxes & Restaurant GST (5%)</span>
                <span>₹{taxes}</span>
              </div>

              <div className="bill-line total-line">
                <strong>To Pay</strong>
                <strong className="total-highlight-val">₹{totalAmount}</strong>
              </div>
            </div>

            {/* Sticky Checkout CTA Footer */}
            <div className="cart-drawer-footer">
              <button
                className="checkout-primary-cta"
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
              >
                <span>Proceed to Checkout</span>
                <span className="cta-price-tag">₹{totalAmount} ➔</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
