import React, { useState } from "react";
import { apiService } from "../services/api";

export default function TableBookingModal({
  restaurant,
  restaurants = [],
  loggedInUser,
  onClose,
  onBookingSuccess
}) {
  const [selectedRestId, setSelectedRestId] = useState(
    restaurant ? restaurant.restaurant_id : (restaurants[0]?.restaurant_id || 1)
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(todayStr);
  const [timeSlot, setTimeSlot] = useState("07:30 PM");
  const [guestsCount, setGuestsCount] = useState(2);
  const [guestName, setGuestName] = useState(loggedInUser?.name || "");
  const [guestPhone, setGuestPhone] = useState(loggedInUser?.phone || "");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

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
    restaurants[0];

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
        special_requests: specialRequests.trim()
      };

      const result = await apiService.createTableBooking(bookingPayload);
      if (result.success) {
        setConfirmedBooking(result.booking);
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="table-booking-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        {!confirmedBooking ? (
          <>
            <div className="booking-modal-header">
              <span className="section-label">DINE IN WITH SMARTBITE</span>
              <h2>🍽️ Reserve a Restaurant Table</h2>
              <p>Instant table confirmation at top dining destinations in Hyderabad.</p>
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
                    >
                      −
                    </button>
                    <span>{guestsCount} {guestsCount === 1 ? "Guest" : "Guests"}</span>
                    <button
                      type="button"
                      onClick={() => setGuestsCount((g) => Math.min(12, g + 1))}
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

            <div className="success-actions">
              <button className="primary-btn" onClick={onClose}>
                Done & Continue Browsing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
