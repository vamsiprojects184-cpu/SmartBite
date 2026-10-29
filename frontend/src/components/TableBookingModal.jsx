import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";

export default function TableBookingModal({
  restaurant = null,
  restaurants = [],
  loggedInUser = null,
  onClose,
  onBookingSuccess
}) {
  const [activeTab, setActiveTab] = useState("reserve"); // "reserve" | "my_bookings"
  const [selectedRestId, setSelectedRestId] = useState(
    restaurant ? restaurant.restaurant_id : (restaurants[0]?.restaurant_id || 1)
  );

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const [date, setDate] = useState(todayStr);
  const [timeSlot, setTimeSlot] = useState("07:30 PM");
  const [guestsCount, setGuestsCount] = useState(2);
  const [guestName, setGuestName] = useState(loggedInUser?.name || "");
  const [guestPhone, setGuestPhone] = useState(loggedInUser?.phone || "");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const availableSlots = [
    "12:30 PM",
    "01:15 PM",
    "02:00 PM",
    "07:00 PM",
    "07:30 PM",
    "08:15 PM",
    "09:00 PM",
    "09:30 PM"
  ];

  const currentRest =
    restaurants.find((r) => r.restaurant_id === Number(selectedRestId)) ||
    restaurant ||
    restaurants[0] || {
      restaurant_id: 1,
      name: "SmartBite Dining Kitchen",
      city: "Banjara Hills, Hyderabad",
      rating: "4.8"
    };

  useEffect(() => {
    loadBookings();
  }, [loggedInUser, activeTab]);

  async function loadBookings() {
    setLoadingBookings(true);
    try {
      const data = await apiService.getTableBookings(loggedInUser?.user_id || 1);
      setMyBookings(data || []);
    } catch (e) {
      console.warn("Failed to load table bookings:", e);
    } finally {
      setLoadingBookings(false);
    }
  }

  async function handleBookingSubmit(e) {
    e.preventDefault();
    if (!guestName.trim()) {
      alert("Please enter your name.");
      return;
    }
    if (!guestPhone.trim() || guestPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setIsSubmitting(true);
      const bookingPayload = {
        restaurant_id: currentRest.restaurant_id,
        restaurant_name: currentRest.name,
        user_id: loggedInUser?.user_id || 1,
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim(),
        guests_count: guestsCount,
        booking_date: date,
        booking_time: timeSlot,
        special_requests: specialRequests.trim() || "None"
      };

      const result = await apiService.createTableBooking(bookingPayload);
      if (result.success) {
        setConfirmedBooking(result.booking);
        loadBookings();
        if (onBookingSuccess) {
          onBookingSuccess(result.booking);
        }
      }
    } catch (err) {
      console.error("Booking error:", err);
      alert("Could not reserve table. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelBooking(bookingId) {
    if (window.confirm("Are you sure you want to cancel this table reservation?")) {
      await apiService.cancelTableBooking(bookingId);
      loadBookings();
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="table-booking-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        {activeTab === "reserve" ? (
          !confirmedBooking ? (
            <>
              <div className="booking-modal-header">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span className="section-label">DINE IN WITH SMARTBITE</span>
                    <h2>🍽️ Reserve a Restaurant Table</h2>
                    <p>Instant table confirmation at top dining destinations in Hyderabad.</p>
                  </div>
                  {myBookings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("my_bookings")}
                      style={{
                        background: "#fff7ed",
                        border: "1px solid #fed7aa",
                        color: "#ea580c",
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      📋 My Bookings ({myBookings.length})
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleBookingSubmit} className="booking-form">
                {/* Restaurant Selector */}
                <div className="form-group">
                  <label>Selected Restaurant:</label>
                  <select
                    value={selectedRestId}
                    onChange={(e) => setSelectedRestId(Number(e.target.value))}
                    className="booking-input-select"
                  >
                    {restaurants.map((r) => (
                      <option key={r.restaurant_id} value={r.restaurant_id}>
                        {r.name} • {r.city || "Hyderabad"} ({r.rating || "4.8"} ★)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Guests Count */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Date of Visit:</label>
                    <input
                      type="date"
                      min={todayStr}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="booking-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Number of Guests:</label>
                    <div className="guest-counter">
                      <button
                        type="button"
                        onClick={() => setGuestsCount((g) => Math.max(1, g - 1))}
                        aria-label="Decrease guests"
                      >
                        −
                      </button>
                      <span>
                        {guestsCount} {guestsCount === 1 ? "Guest" : "Guests"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setGuestsCount((g) => Math.min(12, g + 1))}
                        aria-label="Increase guests"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Time Slots */}
                <div className="form-group">
                  <label>Select Time Slot:</label>
                  <div className="time-slots-grid">
                    {availableSlots.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        className={`time-slot-btn ${timeSlot === slot ? "active" : ""}`}
                        onClick={() => setTimeSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Your Full Name:</label>
                    <input
                      type="text"
                      placeholder="E.g. Mohammed Ahmed"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                      className="booking-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Contact Mobile Number:</label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      required
                      className="booking-input"
                    />
                  </div>
                </div>

                {/* Special Requests */}
                <div className="form-group">
                  <label>Special Requests (Optional):</label>
                  <input
                    type="text"
                    placeholder="E.g. Quiet corner, High chair, Birthday celebration"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="booking-input"
                  />
                </div>

                <button type="submit" className="booking-submit-cta" disabled={isSubmitting}>
                  {isSubmitting ? "Securing Table..." : `Confirm Reservation at ${currentRest.name}`}
                </button>
              </form>
            </>
          ) : (
            /* Confirmation Screen */
            <div className="booking-success-view">
              <div className="success-icon-badge">✅</div>
              <h2>Table Reserved Successfully!</h2>
              <p className="booking-subhead">
                Your table is reserved at <strong>{confirmedBooking.restaurant_name}</strong>.
              </p>

              <div className="booking-confirmation-card">
                <div className="confirm-row">
                  <span>Booking ID:</span>
                  <strong>{confirmedBooking.booking_id}</strong>
                </div>
                <div className="confirm-row">
                  <span>Date & Time:</span>
                  <strong>{confirmedBooking.booking_date} at {confirmedBooking.booking_time}</strong>
                </div>
                <div className="confirm-row">
                  <span>Party Size:</span>
                  <strong>{confirmedBooking.guests_count} Guests</strong>
                </div>
                <div className="confirm-row">
                  <span>Reserved For:</span>
                  <strong>{confirmedBooking.guest_name} ({confirmedBooking.guest_phone})</strong>
                </div>
                {confirmedBooking.special_requests && confirmedBooking.special_requests !== "None" && (
                  <div className="confirm-row">
                    <span>Special Note:</span>
                    <strong>{confirmedBooking.special_requests}</strong>
                  </div>
                )}
                <div className="confirm-row status">
                  <span>Reservation Status:</span>
                  <span className="confirmed-pill">● Confirmed</span>
                </div>
              </div>

              <div className="success-actions" style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button className="primary-btn" onClick={onClose}>
                  Done & Continue Browsing
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setConfirmedBooking(null);
                    setActiveTab("my_bookings");
                  }}
                >
                  View All Reservations
                </button>
              </div>
            </div>
          )
        ) : (
          /* My Reservations View */
          <div className="my-reservations-view" style={{ padding: "10px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <span className="section-label">SMARTBITE DINING</span>
                <h2>📋 My Table Reservations</h2>
              </div>
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  setConfirmedBooking(null);
                  setActiveTab("reserve");
                }}
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                + Book Another Table
              </button>
            </div>

            {loadingBookings ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                Loading your reservations...
              </div>
            ) : myBookings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <span style={{ fontSize: "48px", display: "block", marginBottom: "12px" }}>🍽️</span>
                <h3>No Table Reservations Found</h3>
                <p style={{ color: "#6b7280", margin: "8px 0 20px" }}>
                  Reserve a table in advance at top Hyderabad kitchens to skip queues.
                </p>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => setActiveTab("reserve")}
                >
                  Book a Table Now
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {myBookings.map((b) => (
                  <div
                    key={b.booking_id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "14px",
                      padding: "16px 20px",
                      background: "#fafafa",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: "700", color: "#ef6c2f", fontSize: "14px" }}>
                          #{b.booking_id}
                        </span>
                        <h4 style={{ margin: 0, fontSize: "16px" }}>{b.restaurant_name}</h4>
                      </div>
                      <div style={{ fontSize: "13px", color: "#4b5563", display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "4px" }}>
                        <span>📅 {b.booking_date}</span>
                        <span>⏰ {b.booking_time}</span>
                        <span>👥 {b.guests_count} Guests</span>
                        <span>👤 {b.guest_name}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                      <span
                        className={`confirmed-pill ${b.status === "Cancelled" ? "cancelled" : ""}`}
                        style={{
                          background: b.status === "Cancelled" ? "#fee2e2" : "#ecfdf5",
                          color: b.status === "Cancelled" ? "#dc2626" : "#059669"
                        }}
                      >
                        ● {b.status || "Confirmed"}
                      </span>
                      {b.status !== "Cancelled" && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(b.booking_id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            fontSize: "12px",
                            cursor: "pointer",
                            textDecoration: "underline",
                            padding: 0
                          }}
                        >
                          Cancel Reservation
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
