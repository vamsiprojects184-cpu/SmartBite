import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";

export default function OrderTrackingModal({ orderId, onClose }) {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTracking() {
      try {
        setLoading(true);
        const data = await apiService.getOrderTracking(orderId);
        setTrackingData(data);
      } catch (e) {
        console.error("Tracking load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadTracking();
  }, [orderId]);

  if (!orderId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="order-tracking-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        <div className="tracking-header">
          <span className="section-label">LIVE DELIVERY TRACKING</span>
          <h2>🛵 Tracking Order #{orderId}</h2>
          <p className="eta-highlight">
            Estimated Arrival: <strong>{trackingData?.estimated_delivery_time || "22 minutes"}</strong>
          </p>
        </div>

        {loading ? (
          <div className="loading-state">Connecting to delivery GPS...</div>
        ) : (
          <div className="tracking-body">
            {/* Timeline progression */}
            <div className="tracking-timeline">
              {trackingData?.stages?.map((stage, idx) => {
                const isCompleted = idx <= (trackingData.step || 2);
                const isCurrent = idx === (trackingData.step || 2);
                return (
                  <div
                    key={idx}
                    className={`timeline-step ${isCompleted ? "completed" : ""} ${
                      isCurrent ? "current" : ""
                    }`}
                  >
                    <div className="step-marker">
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <div className="step-info">
                      <strong>{stage.name}</strong>
                      <span>{stage.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Delivery Partner Card */}
            {trackingData?.delivery_partner && (
              <div className="delivery-partner-card">
                <div className="partner-avatar">🛵</div>
                <div className="partner-details">
                  <h4>{trackingData.delivery_partner.name}</h4>
                  <p>
                    Vehicle: {trackingData.delivery_partner.vehicle} • {trackingData.delivery_partner.rating || "4.9 ★"}
                  </p>
                  <small>SmartBite Certified Hygienic Delivery Partner</small>
                </div>
                <a
                  href={`tel:${trackingData.delivery_partner.phone}`}
                  className="call-valet-btn"
                  title="Call delivery partner"
                >
                  📞 Call
                </a>
              </div>
            )}

            {/* Delivery Location & Order Details */}
            <div className="tracking-order-summary">
              <div className="summary-section">
                <span className="summary-title">📍 Delivery Address</span>
                <p>{trackingData?.delivery_address || "Hyderabad, Telangana"}</p>
              </div>

              {trackingData?.restaurant_name && (
                <div className="summary-section">
                  <span className="summary-title">🍴 Restaurant</span>
                  <p>{trackingData.restaurant_name}</p>
                </div>
              )}

              {trackingData?.items && trackingData.items.length > 0 && (
                <div className="summary-section">
                  <span className="summary-title">🧾 Items Ordered</span>
                  <div className="tracking-items-list">
                    {trackingData.items.map((item, i) => (
                      <div key={i} className="tracking-item-row">
                        <span>{item.food_name || "Food Item"} × {item.quantity || 1}</span>
                        <span>₹{Number(item.price || 0) * (item.quantity || 1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="tracking-total-row">
                <span>Total Paid:</span>
                <strong>₹{trackingData?.total_amount || 0}</strong>
              </div>
            </div>

            <button className="primary-btn" onClick={onClose} style={{ width: "100%", marginTop: "15px" }}>
              Back to SmartBite
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
