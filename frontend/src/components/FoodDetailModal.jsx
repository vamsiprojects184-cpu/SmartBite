import React, { useState } from "react";

export default function FoodDetailModal({
  food,
  onClose,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
  onOpenCompare,
  onSelectFood
}) {
  const [quantity, setQuantity] = useState(1);

  if (!food) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="food-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        <div className="food-detail-grid">
          {/* Left Column: Image and badges */}
          <div className="food-detail-image-box">
            <img
              src={food.image_url}
              alt={food.food_name}
              className="food-detail-img"
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80";
              }}
            />
            <div className="food-detail-tags">
              <span className={food.is_vegetarian ? "badge-veg" : "badge-nonveg"}>
                {food.is_vegetarian ? "🌱 PURE VEG" : "🍗 NON-VEG"}
              </span>
              {food.is_popular && <span className="badge-popular">★ POPULAR</span>}
              {food.health_label && <span className="badge-health">{food.health_label}</span>}
            </div>
          </div>

          {/* Right Column: Details & Nutrition */}
          <div className="food-detail-info">
            <div className="food-detail-header">
              <div>
                <span className="food-restaurant-name">📍 {food.restaurant_name}</span>
                <h2>{food.food_name}</h2>
              </div>
              <button
                className={`favorite-action-btn ${isFavorite ? "active" : ""}`}
                onClick={() => onToggleFavorite(food)}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorite ? "❤️" : "🤍"}
              </button>
            </div>

            <div className="food-price-row">
              <span className="food-price-tag">₹{food.price}</span>
              <span className="food-serving">🍽️ {food.serving_info || "Serves 1"}</span>
            </div>

            <p className="food-description">{food.description}</p>

            {food.ingredients && (
              <div className="food-ingredients">
                <strong>Ingredients:</strong>
                <p>{food.ingredients}</p>
              </div>
            )}

            {/* Nutrition Intelligence Box */}
            <div className="nutrition-breakdown-card">
              <div className="nutrition-card-header">
                <h4>📊 Nutrition Intelligence (Per Serving)</h4>
                <span className="health-score-pill">
                  Health Score: <strong>{food.health_rating || "8.5/10"}</strong>
                </span>
              </div>

              <div className="macros-grid">
                <div className="macro-item calories">
                  <span className="macro-val">{food.calories || 0}</span>
                  <span className="macro-label">Calories (kcal)</span>
                </div>
                <div className="macro-item protein">
                  <span className="macro-val">{food.protein || 0}g</span>
                  <span className="macro-label">Protein</span>
                </div>
                <div className="macro-item carbs">
                  <span className="macro-val">{food.carbs || 0}g</span>
                  <span className="macro-label">Carbs</span>
                </div>
                <div className="macro-item fat">
                  <span className="macro-val">{food.fat || 0}g</span>
                  <span className="macro-label">Fat</span>
                </div>
                <div className="macro-item fiber">
                  <span className="macro-val">{food.fiber || 0}g</span>
                  <span className="macro-label">Fiber</span>
                </div>
              </div>

              {food.protein >= 25 && (
                <div className="nutrition-tip-alert tip-success">
                  💪 <strong>High Protein Pick:</strong> Delivers {food.protein}g protein, perfect for muscle recovery and satiety.
                </div>
              )}
              {food.calories <= 350 && (
                <div className="nutrition-tip-alert tip-light">
                  🥗 <strong>Calorie Smart:</strong> Under 350 kcal, ideal for weight management and balanced dining.
                </div>
              )}
            </div>

            {/* Actions: Compare & Add to Cart */}
            <div className="food-detail-actions">
              <div className="qty-selector">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)}>+</button>
              </div>

              <button
                className="add-to-cart-cta"
                onClick={() => {
                  onAddToCart(food, quantity);
                  onClose();
                }}
              >
                Add {quantity} to Cart • ₹{food.price * quantity}
              </button>

              {onOpenCompare && (
                <button
                  className="compare-trigger-btn"
                  onClick={() => {
                    onClose();
                    onOpenCompare(food);
                  }}
                  title="Compare nutrition with another dish"
                >
                  ⚖️ Compare
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
