import React, { useState } from "react";
import { apiService } from "../services/api";

export default function CheckoutModal({
  cart = [],
  deliveryAddress = "",
  setDeliveryAddress,
  loggedInUser,
  onClose,
  onOrderSuccess,
  onOpenLogin
}) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isPlacing, setIsPlacing] = useState(false);

  // Cart financial calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
    0
  );

  const deliveryFee = subtotal >= 299 || subtotal === 0 ? 0 : 40;
  const taxes = Math.round(subtotal * 0.05); // 5% restaurant GST

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_percent) {
      discount = Math.min(
        Math.round((subtotal * appliedCoupon.discount_percent) / 100),
        appliedCoupon.max_discount || 100
      );
    } else if (appliedCoupon.discount_flat) {
      discount = appliedCoupon.discount_flat;
    }
  }

  const finalTotal = Math.max(0, subtotal + deliveryFee + taxes - discount);

  function handleApplyCoupon(code) {
    const codeToTest = (code || couponCode).toUpperCase().trim();
    setCouponError("");

    const coupons = apiService.getCoupons();
    const found = coupons.find((c) => c.code === codeToTest);

    if (!found) {
      setCouponError("Invalid coupon code.");
      setAppliedCoupon(null);
      return;
    }

    if (found.min_order && subtotal < found.min_order) {
      setCouponError(`Min order of ₹${found.min_order} required for ${found.code}.`);
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(found);
    setCouponCode(found.code);
  }

  async function handlePlaceOrder() {
    if (!loggedInUser) {
      alert("Please login before placing your order.");
      onClose();
      onOpenLogin();
      return;
    }

    if (!deliveryAddress || !deliveryAddress.trim()) {
      alert("Please enter a valid delivery address.");
      return;
    }

    try {
      setIsPlacing(true);
      const orderPayload = {
        user_id: loggedInUser.user_id,
        restaurant_id: cart[0]?.restaurant_id || 1,
        restaurant_name: cart[0]?.restaurant_name || "SmartBite Kitchen",
        delivery_address: deliveryAddress.trim(),
        total_amount: finalTotal,
        items: cart.map((item) => ({
          food_id: item.food_id,
          food_name: item.food_name,
          quantity: item.quantity || 1,
          price: Number(item.price || 0)
        })),
        payment_method: paymentMethod
      };

      const result = await apiService.createOrder(orderPayload);
      if (result.success) {
        onOrderSuccess(result.order);
      }
    } catch (e) {
      console.error("Order placement error:", e);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="checkout-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        <div className="checkout-header">
          <span className="section-label">SECURE ORDERING</span>
          <h2>🧾 Order Summary & Checkout</h2>
          <p>Review items, delivery destination, and payment method.</p>
        </div>

        <div className="checkout-grid">
          {/* Left Column: Items and Coupons */}
          <div className="checkout-left-col">
            <div className="order-items-scroll">
              {cart.map((item, idx) => (
                <div key={idx} className="checkout-item-card">
                  <div className="item-main-info">
                    <span className={item.is_vegetarian ? "veg-dot" : "non-veg-dot"}>
                      {item.is_vegetarian ? "🟢" : "🔴"}
                    </span>
                    <div>
                      <strong>{item.food_name}</strong>
                      <small>₹{item.price} × {item.quantity || 1}</small>
                    </div>
                  </div>
                  <strong className="item-subtotal-val">
                    ₹{Number(item.price || 0) * (item.quantity || 1)}
                  </strong>
                </div>
              ))}
            </div>

            {/* Coupons Section */}
            <div className="coupon-box">
              <label>Apply Promo Coupon:</label>
              <div className="coupon-input-group">
                <input
                  type="text"
                  placeholder="Enter code (e.g. SMART50)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <button type="button" onClick={() => handleApplyCoupon()}>
                  Apply
                </button>
              </div>

              {couponError && <p className="coupon-error">{couponError}</p>}
              {appliedCoupon && (
                <p className="coupon-success">
                  🎉 <strong>{appliedCoupon.code}</strong> applied! You saved ₹{discount}.
                </p>
              )}

              {/* Coupon Suggestions */}
              <div className="available-coupons-pills">
                <button
                  type="button"
                  className="coupon-pill"
                  onClick={() => handleApplyCoupon("SMART50")}
                >
                  🏷️ SMART50 (50% OFF)
                </button>
                <button
                  type="button"
                  className="coupon-pill"
                  onClick={() => handleApplyCoupon("FITBITE")}
                >
                  🏷️ FITBITE (₹75 OFF)
                </button>
                <button
                  type="button"
                  className="coupon-pill"
                  onClick={() => handleApplyCoupon("HYD100")}
                >
                  🏷️ HYD100 (₹100 OFF)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Address, Payment & Bill */}
          <div className="checkout-right-col">
            <div className="address-input-group">
              <label>📍 Delivery Address in Hyderabad:</label>
              <textarea
                rows="2"
                placeholder="House / Flat No, Street, Landmark, Area, Hyderabad"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
                className="checkout-address-input"
              />
              <div className="quick-addr-pills">
                <button
                  type="button"
                  onClick={() =>
                    setDeliveryAddress("Flat 402, Sai Residency, Madhapur, Hyderabad - 500081")
                  }
                >
                  🏠 Use Home
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDeliveryAddress("Building 12B, Mindspace IT Park, Hitec City, Hyderabad - 500081")
                  }
                >
                  🏢 Use Work
                </button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="payment-method-group">
              <label>Select Payment Method:</label>
              <div className="payment-options-grid">
                <label className={`payment-pill ${paymentMethod === "UPI" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="UPI"
                    checked={paymentMethod === "UPI"}
                    onChange={() => setPaymentMethod("UPI")}
                  />
                  <span>📱 UPI (GPay / PhonePe / Paytm)</span>
                </label>

                <label className={`payment-pill ${paymentMethod === "COD" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                  />
                  <span>💵 Cash on Delivery (COD)</span>
                </label>

                <label className={`payment-pill ${paymentMethod === "Card" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="Card"
                    checked={paymentMethod === "Card"}
                    onChange={() => setPaymentMethod("Card")}
                  />
                  <span>💳 Credit / Debit Card</span>
                </label>
              </div>
              <small className="demo-notice">ℹ️ FoodTech payment simulator enabled.</small>
            </div>

            {/* Bill Summary */}
            <div className="bill-summary-card">
              <div className="bill-row">
                <span>Item Subtotal:</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="bill-row">
                <span>Delivery Partner Fee:</span>
                <span>{deliveryFee === 0 ? <strong style={{ color: "#3e7c35" }}>FREE</strong> : `₹${deliveryFee}`}</span>
              </div>
              <div className="bill-row">
                <span>Restaurant GST & Charges (5%):</span>
                <span>₹{taxes}</span>
              </div>
              {discount > 0 && (
                <div className="bill-row discount-row">
                  <span>Coupon Discount ({appliedCoupon?.code}):</span>
                  <span>− ₹{discount}</span>
                </div>
              )}
              <div className="bill-row grand-total">
                <strong>To Pay:</strong>
                <strong className="grand-price">₹{finalTotal}</strong>
              </div>
            </div>

            <button
              className="place-order-cta-btn"
              onClick={handlePlaceOrder}
              disabled={isPlacing || cart.length === 0}
            >
              {isPlacing ? "Confirming Order..." : `Place Order • ₹${finalTotal}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
