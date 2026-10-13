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
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const [date, setDate] = useState(todayStr);
  const [timeSlot, setTimeSlot] = useState("07:30 PM");
  const [guestsCount, setGuestsCount] = useState(2);
  const [seatingArea, setSeatingArea] = useState("Indoor AC");
  const [occasion, setOccasion] = useState("Casual Dining");
  const [guestName, setGuestName] = useState(loggedInUser?.name || "");
  const [guestPhone, setGuestPhone] = useState(loggedInUser?.phone || "");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Fallback restaurant if none found
  const currentRest =
    restaurants.find((r) => r.restaurant_id === Number(selectedRestId)) ||
    restaurant ||
    restaurants[0] || {
      restaurant_id: 1,
      name: "SmartBite Dining Kitchen",
      city: "Banjara Hills, Hyderabad",
      rating: "4.8",
      cuisine: "Multi-Cuisine & Healthy Bowls",
      image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80"
    };

  const lunchSlots = ["12:30 PM", "01:15 PM", "02:00 PM", "02:45 PM"];
  const dinnerSlots = ["07:00 PM", "07:30 PM", "08:15 PM", "09:00 PM", "09:45 PM", "10:15 PM"];

  const seatingOptions = [
    { id: "Indoor AC", label: "❄️ Indoor AC Dining", desc: "Cool, calm ambiance" },
    { id: "Outdoor Rooftop", label: "🌆 Rooftop Terrace", desc: "Open sky & skyline view" },
    { id: "Romantic Corner", label: "🕯️ Romantic Corner", desc: "Cozy private booth" },
    { id: "Family Lounge", label: "👨‍👩‍👧 Family Long Table", desc: "Spacious seating" }
  ];

  const occasionOptions = [
    "Casual Dining",
    "Birthday Celebration 🎂",
    "Anniversary ❤️",
    "Business Dinner 💼",
    "Family Gathering 👨‍👩‍👦"
  ];

  // Fetch bookings when switching to My Reservations tab
  useEffect(() => {
    if (activeTab === "my_bookings") {
      loadBookings();
    }
  }, [activeTab]);

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
        seating_area: seatingArea,
        occasion: occasion,
        special_requests: specialRequests.trim() || "None"
      };

      const result = await apiService.createTableBooking(bookingPayload);
      if (result.success) {
        setConfirmedBooking(result.booking);
        if (onBookingSuccess) {
          onBookingSuccess(result.booking);
        }
      }
    } catch (err) {
      console.error("Booking submission error:", err);
      alert("Could not reserve table. Please try again or call the restaurant directly.");
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

        {/* Modal Top Banner */}
        <div className="booking-modal-header">
          <div className="booking-header-badges">
            <span className="booking-pill-badge">✨ INSTANT CONFIRMATION</span>
            <span className="booking-pill-badge green">100% FREE BOOKING</span>
          </div>
          <h2>🍽️ Table Reservations</h2>
          <p>Book premium dining tables across Hyderabad with zero reservation fee.</p>

          {/* Navigation Tabs */}
          <div className="booking-tabs-nav">
            <button
              type="button"
              className={`booking-tab-btn ${activeTab === "reserve" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("reserve");
                setConfirmedBooking(null);
              }}
            >
              📅 Reserve a Table
            </button>
            <button
              type="button"
              className={`booking-tab-btn ${activeTab === "my_bookings" ? "active" : ""}`}
              onClick={() => setActiveTab("my_bookings")}
            >
              📋 My Reservations {myBookings.length > 0 && `(${myBookings.length})`}
            </button>
          </div>
        </div>

        {activeTab === "reserve" ? (
          !confirmedBooking ? (
            <form onSubmit={handleBookingSubmit} className="booking-form">
              {/* Selected Restaurant Card */}
              <div className="booking-section-card">
                <label className="booking-field-label">1. Choose Dining Destination</label>
                {restaurants.length > 1 && !restaurant && (
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
                )}

                <div className="booking-rest-preview">
                  <img
                    src={currentRest.image_url}
                    alt={currentRest.name}
                    className="booking-rest-thumb"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80";
                    }}
                  />
                  <div className="booking-rest-info">
                    <h4>{currentRest.name}</h4>
                    <p>📍 {currentRest.address || currentRest.city || "Hyderabad, Telangana"}</p>
                    <div className="booking-rest-tags">
                      <span>★ {currentRest.rating || "4.8"} Rating</span>
                      <span>⏱️ Open Now</span>
                      <span>💰 ₹{currentRest.price_for_two || 500} for two</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date & Guests Row */}
              <div className="booking-section-card">
                <label className="booking-field-label">2. Date & Party Size</label>

                {/* Quick Date Shortcuts */}
                <div className="quick-date-chips">
                  <button
                    type="button"
                    className={`date-chip ${date === todayStr ? "active" : ""}`}
                    onClick={() => setDate(todayStr)}
                  >
                    Today ({today.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })})
                  </button>
                  <button
                    type="button"
                    className={`date-chip ${date === tomorrowStr ? "active" : ""}`}
                    onClick={() => setDate(tomorrowStr)}
                  >
                    Tomorrow ({tomorrow.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })})
                  </button>
                  <div className="custom-date-picker">
                    <input
                      type="date"
                      min={todayStr}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="booking-input-date"
                    />
                  </div>
                </div>

                {/* Guest Counter */}
                <div className="booking-guest-row">
                  <span className="guest-row-title">Number of Guests:</span>
                  <div className="guest-counter-control">
                    <button
                      type="button"
                      onClick={() => setGuestsCount((g) => Math.max(1, g - 1))}
                      aria-label="Decrease guests"
                    >
                      −
                    </button>
                    <span className="guest-number-display">
                      {guestsCount} {guestsCount === 1 ? "Person" : "Persons"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGuestsCount((g) => Math.min(15, g + 1))}
                      aria-label="Increase guests"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Quick Guest Count Pills */}
                <div className="quick-guest-pills">
                  {[2, 4, 6, 8, 10].map((num) => (
                    <button
                      type="button"
                      key={num}
                      className={`guest-pill-btn ${guestsCount === num ? "active" : ""}`}
                      onClick={() => setGuestsCount(num)}
                    >
                      {num} Guests
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              <div className="booking-section-card">
                <label className="booking-field-label">3. Select Dining Time</label>

                <div className="time-group">
                  <span className="time-group-label">☀️ Lunch Hours</span>
                  <div className="time-slots-grid">
                    {lunchSlots.map((slot) => (
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

                <div className="time-group" style={{ marginTop: "14px" }}>
                  <span className="time-group-label">🌙 Dinner Hours</span>
                  <div className="time-slots-grid">
                    {dinnerSlots.map((slot) => (
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
              </div>

              {/* Seating Preference & Occasion */}
              <div className="booking-section-card">
                <label className="booking-field-label">4. Seating Area & Occasion</label>

                <div className="seating-grid">
                  {seatingOptions.map((opt) => (
                    <div
                      key={opt.id}
                      className={`seating-card ${seatingArea === opt.id ? "active" : ""}`}
                      onClick={() => setSeatingArea(opt.id)}
                    >
                      <strong>{opt.label}</strong>
                      <small>{opt.desc}</small>
                    </div>
                  ))}
                </div>

                <div className="occasion-select-row" style={{ marginTop: "14px" }}>
                  <label>Dining Occasion:</label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="booking-input-select"
                  >
                    {occasionOptions.map((occ) => (
                      <option key={occ} value={occ}>
                        {occ}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="booking-section-card">
                <label className="booking-field-label">5. Guest Contact Details</label>
                <div className="booking-inputs-grid">
                  <div className="booking-form-item">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      placeholder="E.g. Mohammed Ahmed"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                      className="booking-input"
                    />
                  </div>
                  <div className="booking-form-item">
                    <label>Mobile Number *</label>
                    <input
                      type="tel"
                      placeholder="10-digit WhatsApp/Mobile"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      required
                      className="booking-input"
                    />
                  </div>
                </div>

                <div className="booking-form-item" style={{ marginTop: "12px" }}>
                  <label>Special Requests (Optional)</label>
                  <input
                    type="text"
                    placeholder="E.g. High chair needed, cake arrangement, quiet table..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="booking-input"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="booking-actions-footer">
                <button type="submit" className="booking-submit-cta" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Securing Reservation..."
                  ) : (
                    <>Confirm Reservation at {currentRest.name} →</>
                  )}
                </button>
                <p className="booking-guarantee-note">
                  🔒 Instant confirmation SMS & WhatsApp message will be sent. Cancellation is free anytime.
                </p>
              </div>
            </form>
          ) : (
            /* Confirmation Pass */
            <div className="booking-success-view">
              <div className="success-badge-pulse">🎉</div>
              <h2>Table Reserved Successfully!</h2>
              <p className="booking-subhead">
                Your reservation at <strong>{confirmedBooking.restaurant_name}</strong> is confirmed.
              </p>

              <div className="booking-pass-card">
                <div className="pass-header">
                  <div>
                    <span className="pass-brand">SMARTBITE DINE-IN PASS</span>
                    <h3>{confirmedBooking.restaurant_name}</h3>
                  </div>
                  <div className="pass-code">
                    <span>BOOKING ID</span>
                    <strong>{confirmedBooking.booking_id}</strong>
                  </div>
                </div>

                <div className="pass-grid">
                  <div className="pass-item">
                    <small>DATE</small>
                    <strong>{confirmedBooking.booking_date}</strong>
                  </div>
                  <div className="pass-item">
                    <small>TIME</small>
                    <strong>{confirmedBooking.booking_time}</strong>
                  </div>
                  <div className="pass-item">
                    <small>GUESTS</small>
                    <strong>{confirmedBooking.guests_count} Persons</strong>
                  </div>
                  <div className="pass-item">
                    <small>SEATING</small>
                    <strong>{confirmedBooking.seating_area || "Indoor AC"}</strong>
                  </div>
                  <div className="pass-item">
                    <small>GUEST NAME</small>
                    <strong>{confirmedBooking.guest_name}</strong>
                  </div>
                  <div className="pass-item">
                    <small>STATUS</small>
                    <span className="confirmed-pill">● Confirmed</span>
                  </div>
                </div>

                {confirmedBooking.special_requests && confirmedBooking.special_requests !== "None" && (
                  <div className="pass-note">
                    <small>SPECIAL REQUEST:</small>
                    <p>{confirmedBooking.special_requests}</p>
                  </div>
                )}
              </div>

              <div className="booking-success-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    setActiveTab("my_bookings");
                    loadBookings();
                  }}
                >
                  View My Reservations
                </button>
                <button type="button" className="secondary-btn" onClick={onClose}>
                  Back to SmartBite
                </button>
              </div>
            </div>
          )
        ) : (
          /* My Reservations Tab */
          <div className="my-reservations-view">
            {loadingBookings ? (
              <div className="loading-bookings">Fetching your reservations...</div>
            ) : myBookings.length === 0 ? (
              <div className="no-bookings-placeholder">
                <span className="no-bookings-icon">🍽️</span>
                <h3>No Table Reservations Yet</h3>
                <p>Reserve a table in advance at top Hyderabad kitchens to skip queues.</p>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => setActiveTab("reserve")}
                  style={{ marginTop: "14px" }}
                >
                  Book a Table Now
                </button>
              </div>
            ) : (
              <div className="reservations-list">
                {myBookings.map((b) => (
                  <div key={b.booking_id} className="reservation-card-row">
                    <div className="res-card-left">
                      <span className="res-id">#{b.booking_id}</span>
                      <h4>{b.restaurant_name}</h4>
                      <div className="res-meta">
                        <span>📅 {b.booking_date}</span>
                        <span>⏰ {b.booking_time}</span>
                        <span>👥 {b.guests_count} Guests</span>
                        <span>🪑 {b.seating_area || "Indoor"}</span>
                      </div>
                      <small className="res-booked-for">Reserved for: {b.guest_name} ({b.guest_phone})</small>
                    </div>

                    <div className="res-card-right">
                      <span
                        className={`status-pill ${
                          b.status === "Cancelled" ? "cancelled" : "confirmed"
                        }`}
                      >
                        ● {b.status || "Confirmed"}
                      </span>

                      {b.status !== "Cancelled" && (
                        <button
                          type="button"
                          className="cancel-res-btn"
                          onClick={() => handleCancelBooking(b.booking_id)}
                        >
                          Cancel Booking
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
