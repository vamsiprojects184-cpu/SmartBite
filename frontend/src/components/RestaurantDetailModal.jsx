import React, { useState } from "react";

export default function RestaurantDetailModal({
  restaurant,
  foods,
  onClose,
  onAddToCart,
  onSelectFood,
  onToggleFavorite,
  favoriteFoodIds = []
}) {
  const [activeTab, setActiveTab] = useState("menu"); // "menu" or "reviews"
  const [menuFilter, setMenuFilter] = useState("all"); // "all", "veg", "non-veg"
  const [menuSearch, setMenuSearch] = useState("");

  if (!restaurant) return null;

  // Filter foods belonging to this restaurant
  const restaurantFoods = foods.filter(
    (f) => f.restaurant_id === restaurant.restaurant_id || f.restaurant_name === restaurant.name
  );

  const displayedFoods = restaurantFoods.filter((f) => {
    if (menuFilter === "veg" && !f.is_vegetarian) return false;
    if (menuFilter === "non-veg" && f.is_vegetarian) return false;
    if (menuSearch.trim()) {
      const q = menuSearch.toLowerCase();
      return (
        f.food_name.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="restaurant-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        {/* Restaurant Banner Header */}
        <div className="restaurant-hero-banner">
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            className="restaurant-banner-img"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80";
            }}
          />
          <div className="restaurant-banner-overlay">
            <div className="restaurant-banner-content">
              <span className="restaurant-badge">★ {restaurant.rating || "4.8"} ({restaurant.reviews_count || 500}+ ratings)</span>
              <h2>{restaurant.name}</h2>
              <p className="restaurant-cuisine-tag">{restaurant.cuisine}</p>
              <div className="restaurant-meta-chips">
                <span>⏱️ {restaurant.delivery_time || "25-35 min"}</span>
                <span>💰 ₹{restaurant.price_for_two || 400} for two</span>
                <span>📍 {restaurant.city || "Hyderabad"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="restaurant-action-bar">
          <div className="restaurant-nav-tabs">
            <button
              className={`restaurant-tab-btn ${activeTab === "menu" ? "active" : ""}`}
              onClick={() => setActiveTab("menu")}
            >
              🍽️ Full Menu ({restaurantFoods.length})
            </button>
            <button
              className={`restaurant-tab-btn ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              💬 Reviews & Ratings
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="restaurant-modal-body">
          {activeTab === "menu" ? (
            <>
              {/* Menu Filter and Search Controls */}
              <div className="menu-controls-row">
                <div className="menu-filter-chips">
                  <button
                    className={`filter-chip ${menuFilter === "all" ? "active" : ""}`}
                    onClick={() => setMenuFilter("all")}
                  >
                    All Items
                  </button>
                  <button
                    className={`filter-chip ${menuFilter === "veg" ? "active" : ""}`}
                    onClick={() => setMenuFilter("veg")}
                  >
                    🌱 Pure Veg
                  </button>
                  <button
                    className={`filter-chip ${menuFilter === "non-veg" ? "active" : ""}`}
                    onClick={() => setMenuFilter("non-veg")}
                  >
                    🍗 Non-Veg
                  </button>
                </div>

                <div className="menu-search-input-wrapper">
                  <span>🔍</span>
                  <input
                    type="text"
                    placeholder="Search in this menu..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                  />
                  {menuSearch && (
                    <button className="clear-search" onClick={() => setMenuSearch("")}>
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Food Items List */}
              {displayedFoods.length === 0 ? (
                <div className="no-items-placeholder">
                  <p>No dishes match your filter at {restaurant.name}.</p>
                </div>
              ) : (
                <div className="restaurant-menu-grid">
                  {displayedFoods.map((food) => {
                    const isFav = favoriteFoodIds.some(
                      (id) => Number(id) === Number(food.food_id)
                    );
                    return (
                      <div
                        className="restaurant-food-card"
                        key={food.food_id}
                        onClick={() => onSelectFood(food)}
                      >
                        <div className="food-card-top">
                          <div className="food-text-block">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span className={food.is_vegetarian ? "veg-dot" : "non-veg-dot"}>
                                {food.is_vegetarian ? "🟢 Veg" : "🔴 Non-Veg"}
                              </span>
                              {onToggleFavorite && (
                                <button
                                  type="button"
                                  className="card-fav-inline-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(food);
                                  }}
                                  title={isFav ? "Remove Favorite" : "Add Favorite"}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    color: isFav ? "#ef4444" : "#9ca3af"
                                  }}
                                >
                                  {isFav ? "❤️" : "♡"}
                                </button>
                              )}
                            </div>
                            <h4>{food.food_name}</h4>
                            <span className="price-text">₹{food.price}</span>
                            <p className="card-desc-snippet">{food.description}</p>
                            <div className="nutrition-snippet">
                              <span>🔥 {food.calories} kcal</span>
                              <span>💪 {food.protein}g protein</span>
                              <span className="rating-tag">★ {food.health_rating}</span>
                            </div>
                          </div>

                          <div className="food-card-thumb-wrapper">
                            <img
                              src={food.image_url}
                              alt={food.food_name}
                              className="food-thumb-img"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80";
                              }}
                            />
                            <button
                              className="quick-add-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(food);
                              }}
                            >
                              + ADD
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Reviews Tab */
            <div className="restaurant-reviews-container">
              <div className="reviews-summary-box">
                <div className="rating-large">
                  <strong>{restaurant.rating || "4.8"}</strong>
                  <span>★★★★★</span>
                  <small>Based on {restaurant.reviews_count || 1200} verified orders</small>
                </div>
                <div className="rating-highlights">
                  <div className="highlight-pill">✓ Authentic Hyderabad Recipe</div>
                  <div className="highlight-pill">✓ Tamper-proof Packaging</div>
                  <div className="highlight-pill">✓ Hygienic Preparation</div>
                </div>
              </div>

              <div className="reviews-list">
                <div className="review-card">
                  <div className="review-header">
                    <strong>Mohammed Farhan</strong>
                    <span className="review-stars">★★★★★</span>
                  </div>
                  <p>
                    "Best dining and delivery experience in Hyderabad! The Biryani has that original aromatic dum flavor and the meat was juicy and tender."
                  </p>
                  <small>Verified Foodie • 3 days ago</small>
                </div>

                <div className="review-card">
                  <div className="review-header">
                    <strong>Pooja Reddy</strong>
                    <span className="review-stars">★★★★★</span>
                  </div>
                  <p>
                    "Delivery arrived warm in under 25 minutes. Really appreciate the accurate calorie and protein count on SmartBite!"
                  </p>
                  <small>Fitness Enthusiast • 1 week ago</small>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
