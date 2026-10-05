import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";

export default function UserProfileModal({
  user,
  orders = [],
  onClose,
  onLogout,
  onTrackOrder
}) {
  const [activeTab, setActiveTab] = useState("diet_profile"); // "diet_profile", "orders", "addresses"
  const [dietProfile, setDietProfile] = useState({
    diet_type: "any",
    fitness_goal: "balanced",
    target_calories: 2000,
    target_protein: 75,
    allergies: "None",
    budget_preference: "medium"
  });
  const [savedAddresses, setSavedAddresses] = useState([
    { id: 1, label: "Home", address: "Flat 402, Sai Residency, Madhapur, Hyderabad - 500081", isDefault: true },
    { id: 2, label: "Work", address: "Building 12B, Mindspace IT Park, Hitec City, Hyderabad - 500081", isDefault: false }
  ]);
  const [newAddressInput, setNewAddressInput] = useState("");
  const [newAddressLabel, setNewAddressLabel] = useState("Home");
  const [saveSuccessNotice, setSaveSuccessNotice] = useState("");

  useEffect(() => {
    if (user) {
      const profile = apiService.getDietProfile(user.user_id);
      setDietProfile(profile);
    }
  }, [user]);

  function handleSaveDietProfile(e) {
    e.preventDefault();
    if (!user) return;
    apiService.saveDietProfile(user.user_id, dietProfile);
    setSaveSuccessNotice("Dietary preferences updated! Recommendations adjusted.");
    setTimeout(() => setSaveSuccessNotice(""), 3500);
  }

  function handleAddAddress(e) {
    e.preventDefault();
    if (!newAddressInput.trim()) return;
    const newEntry = {
      id: Date.now(),
      label: newAddressLabel,
      address: newAddressInput.trim(),
      isDefault: savedAddresses.length === 0
    };
    setSavedAddresses([...savedAddresses, newEntry]);
    setNewAddressInput("");
  }

  if (!user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        {/* Profile Card Header */}
        <div className="profile-hero-card">
          <div className="profile-avatar-circle">
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="profile-details-text">
            <h3>{user.name}</h3>
            <p>📧 {user.email}</p>
            <p>📱 {user.phone || "+91 98765 43210"}</p>
            <span className="smartbite-member-badge">⭐ SmartBite Pro Member</span>
          </div>
          <button
            className="profile-logout-btn"
            onClick={() => {
              onLogout();
              onClose();
            }}
          >
            Logout
          </button>
        </div>

        {/* Profile Tabs */}
        <div className="profile-tabs-nav">
          <button
            className={`profile-tab-btn ${activeTab === "diet_profile" ? "active" : ""}`}
            onClick={() => setActiveTab("diet_profile")}
          >
            🥗 Personal Diet & Nutrition
          </button>
          <button
            className={`profile-tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            📋 Orders ({orders.length})
          </button>
          <button
            className={`profile-tab-btn ${activeTab === "addresses" ? "active" : ""}`}
            onClick={() => setActiveTab("addresses")}
          >
            📍 Saved Addresses
          </button>
        </div>

        {/* Tab 1: Diet Profile */}
        {activeTab === "diet_profile" && (
          <form onSubmit={handleSaveDietProfile} className="diet-profile-form">
            <div className="form-info-banner">
              💡 SmartBite uses your nutrition profile to personalize meal recommendations, macro warnings, and smart alternatives.
            </div>

            {saveSuccessNotice && (
              <div className="save-success-banner">{saveSuccessNotice}</div>
            )}

            <div className="form-row-2">
              <div className="form-group">
                <label>Dietary Preference:</label>
                <select
                  value={dietProfile.diet_type}
                  onChange={(e) =>
                    setDietProfile({ ...dietProfile, diet_type: e.target.value })
                  }
                  className="profile-input"
                >
                  <option value="any">No Restriction (All Foods)</option>
                  <option value="vegetarian">Pure Vegetarian (🌱)</option>
                  <option value="non-vegetarian">Non-Vegetarian Focused (🍗)</option>
                  <option value="vegan">Strict Vegan</option>
                  <option value="eggetarian">Eggetarian</option>
                </select>
              </div>

              <div className="form-group">
                <label>Fitness / Health Goal:</label>
                <select
                  value={dietProfile.fitness_goal}
                  onChange={(e) =>
                    setDietProfile({ ...dietProfile, fitness_goal: e.target.value })
                  }
                  className="profile-input"
                >
                  <option value="balanced">Balanced Healthy Living</option>
                  <option value="muscle_gain">Muscle Building / Hypertrophy (High Protein)</option>
                  <option value="weight_loss">Fat Loss / Calorie Deficit</option>
                  <option value="low_carb">Low Carb / Keto Friendly</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Daily Calorie Target (kcal):</label>
                <input
                  type="number"
                  min="1200"
                  max="4500"
                  value={dietProfile.target_calories}
                  onChange={(e) =>
                    setDietProfile({ ...dietProfile, target_calories: Number(e.target.value) })
                  }
                  className="profile-input"
                />
              </div>

              <div className="form-group">
                <label>Daily Protein Target (grams):</label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={dietProfile.target_protein}
                  onChange={(e) =>
                    setDietProfile({ ...dietProfile, target_protein: Number(e.target.value) })
                  }
                  className="profile-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Food Allergies or Dislikes:</label>
              <input
                type="text"
                placeholder="E.g. Peanuts, Gluten, Dairy, Shellfish, Mushrooms"
                value={dietProfile.allergies}
                onChange={(e) =>
                  setDietProfile({ ...dietProfile, allergies: e.target.value })
                }
                className="profile-input"
              />
            </div>

            <button type="submit" className="primary-btn" style={{ width: "100%", marginTop: "10px" }}>
              Save Nutrition Profile
            </button>
          </form>
        )}

        {/* Tab 2: Orders */}
        {activeTab === "orders" && (
          <div className="profile-orders-list">
            {orders.length === 0 ? (
              <p className="empty-tab-text">No order history available yet.</p>
            ) : (
              orders.map((o) => (
                <div key={o.order_id} className="profile-order-card">
                  <div className="order-card-header">
                    <div>
                      <strong>Order #{o.order_id}</strong>
                      <small className="order-date-text"> • {o.order_date || "Recent"}</small>
                    </div>
                    <span className="order-status-badge">{o.order_status || "Confirmed"}</span>
                  </div>

                  <p className="order-restaurant-name">🍴 {o.restaurant_name || "SmartBite Partner"}</p>
                  <p className="order-address-text">📍 {o.delivery_address || "Hyderabad"}</p>

                  <div className="order-card-footer">
                    <strong>Total: ₹{o.total_amount}</strong>
                    <button
                      className="track-cta-btn"
                      onClick={() => {
                        onClose();
                        onTrackOrder(o.order_id);
                      }}
                    >
                      Track Order 🛵
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Saved Addresses */}
        {activeTab === "addresses" && (
          <div className="profile-addresses-container">
            <div className="saved-address-cards">
              {savedAddresses.map((addr) => (
                <div key={addr.id} className="address-card">
                  <div className="address-header">
                    <strong>🏷️ {addr.label}</strong>
                    {addr.isDefault && <span className="default-badge">Default</span>}
                  </div>
                  <p>{addr.address}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddAddress} className="add-address-form">
              <h4>+ Add New Delivery Address</h4>
              <div className="form-row-2">
                <select
                  value={newAddressLabel}
                  onChange={(e) => setNewAddressLabel(e.target.value)}
                  className="profile-input"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Gym / Club">Gym / Club</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Complete street address in Hyderabad..."
                  value={newAddressInput}
                  onChange={(e) => setNewAddressInput(e.target.value)}
                  className="profile-input"
                />
              </div>
              <button type="submit" className="secondary-btn" style={{ width: "100%", marginTop: "8px" }}>
                Save Address
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
