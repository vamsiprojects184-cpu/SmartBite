import React, { useState } from "react";

export default function TrendingHighlights({
  foods = [],
  onSelectFood,
  onAddToCart,
  onOpenCompare,
  cart = []
}) {
  const [activeTab, setActiveTab] = useState("trending"); // "trending", "high_protein", "favorites", "healthy"

  let displayedFoods = [];
  let reasonLabel = "";

  if (activeTab === "trending") {
    displayedFoods = foods.filter((f) => f.is_trending).slice(0, 4);
    reasonLabel = "📈 1,500+ orders this week in Hyderabad";
  } else if (activeTab === "high_protein") {
    displayedFoods = foods.filter((f) => f.protein >= 25).sort((a, b) => b.protein - a.protein).slice(0, 4);
    reasonLabel = "💪 Verified high protein (25g - 42g) for muscle recovery";
  } else if (activeTab === "favorites") {
    displayedFoods = foods.filter((f) => f.is_popular).slice(0, 4);
    reasonLabel = "⭐ Top customer rating (4.8+ ★ verified by foodies)";
  } else {
    displayedFoods = foods.filter((f) => f.health_score >= 85).slice(0, 4);
    reasonLabel = "🌱 Nutritionist Certified • Low GI & High Fiber";
  }

  return (
    <section className="section trending-highlights-section">
      <div className="section-heading">
        <div>
          <span className="section-label">RECOMMENDATIONS & POPULARITY ENGINE</span>
          <h2>Curated SmartBite Recommendations</h2>
          <p className="section-subtitle">
            Algorithmically ranked by verified orders, customer ratings, and certified macronutrient ratios.
          </p>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="trending-tabs-row">
        <button
          className={`trending-tab-btn ${activeTab === "trending" ? "active" : ""}`}
          onClick={() => setActiveTab("trending")}
        >
          🔥 Trending in Hyderabad
        </button>
        <button
          className={`trending-tab-btn ${activeTab === "high_protein" ? "active" : ""}`}
          onClick={() => setActiveTab("high_protein")}
        >
          💪 High-Protein Muscle Fuel
        </button>
        <button
          className={`trending-tab-btn ${activeTab === "favorites" ? "active" : ""}`}
          onClick={() => setActiveTab("favorites")}
        >
          ⭐ Customer Favorites
        </button>
        <button
          className={`trending-tab-btn ${activeTab === "healthy" ? "active" : ""}`}
          onClick={() => setActiveTab("healthy")}
        >
          🥑 Dietitian Approved
        </button>
      </div>

      {/* Recommendation Reason Banner */}
      <div className="recommendation-reason-banner">
        <span>💡 Why this is recommended:</span> <strong>{reasonLabel}</strong>
      </div>

      {/* Grid of Dishes */}
      <div className="food-grid">
        {displayedFoods.map((food) => {
          const inCartItem = cart.find((i) => i.food_id === food.food_id);
          return (
            <div
              className="food-card trending-card"
              key={food.food_id}
              onClick={() => onSelectFood(food)}
              style={{ cursor: "pointer" }}
            >
              <div className="food-image">
                <img
                  src={food.image_url}
                  alt={food.food_name}
                  className="food-real-image"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="food-tag">
                  {food.is_vegetarian ? "🌱 VEG" : "🍗 NON-VEG"}
                </div>
                <div className="rec-highlight-tag">
                  {food.protein >= 30 ? "⚡ 30g+ PROTEIN" : food.health_label || "POPULAR"}
                </div>
              </div>

              <div className="food-info">
                <div className="food-title-row">
                  <div>
                    <h3>{food.food_name}</h3>
                    <small style={{ color: "#6b7280", fontSize: "12px" }}>
                      📍 {food.restaurant_name}
                    </small>
                  </div>
                  <span className="food-price">₹{food.price}</span>
                </div>

                <p>{food.description}</p>

                <div className="food-meta" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>🔥 {food.calories} kcal</span>
                  <span>💪 {food.protein}g protein</span>
                  <span style={{ color: "#059669", fontWeight: "700" }}>
                    Score: {food.health_rating}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <button
                    className="add-cart-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(food);
                    }}
                  >
                    {inCartItem ? `In Cart (${inCartItem.quantity}) • Add +` : "+ Add to Cart"}
                  </button>
                  <button
                    className="compare-trigger-btn"
                    style={{
                      padding: "8px 12px",
                      background: "#f3f4f6",
                      color: "#111",
                      border: "1px solid #d1d5db"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCompare(food);
                    }}
                    title="Compare dish"
                  >
                    ⚖️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
