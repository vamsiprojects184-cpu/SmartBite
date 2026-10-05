import React, { useState } from "react";

export default function FoodComparisonModal({
  initialFoodA,
  initialFoodB,
  allFoods,
  onClose,
  onAddToCart
}) {
  const [foodAId, setFoodAId] = useState(
    initialFoodA ? initialFoodA.food_id : (allFoods[0]?.food_id || 1)
  );
  const [foodBId, setFoodBId] = useState(
    initialFoodB
      ? initialFoodB.food_id
      : (allFoods.find((f) => f.food_id !== foodAId)?.food_id || allFoods[1]?.food_id || 2)
  );

  const foodA = allFoods.find((f) => f.food_id === Number(foodAId)) || allFoods[0];
  const foodB = allFoods.find((f) => f.food_id === Number(foodBId)) || allFoods[1];

  if (!foodA || !foodB) return null;

  // Comparison metrics calculation
  const calDiff = (foodB.calories || 0) - (foodA.calories || 0);
  const protDiff = (foodB.protein || 0) - (foodA.protein || 0);
  const carbsDiff = (foodB.carbs || 0) - (foodA.carbs || 0);
  const fatDiff = (foodB.fat || 0) - (foodA.fat || 0);
  const fiberDiff = (foodB.fiber || 0) - (foodA.fiber || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="comparison-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        <div className="comparison-header">
          <span className="section-label">SMARTBITE NUTRITION MATRIX</span>
          <h2>⚖️ Interactive Food Comparison</h2>
          <p>
            Compare two dishes side-by-side to understand macro balances and make healthier choices.
          </p>
        </div>

        {/* Selectors for Food A and Food B */}
        <div className="comparison-selectors-grid">
          {/* Food A Selector */}
          <div className="selector-column column-a">
            <label>Dish A:</label>
            <select
              value={foodAId}
              onChange={(e) => setFoodAId(Number(e.target.value))}
              className="food-select-dropdown"
            >
              {allFoods.map((f) => (
                <option key={f.food_id} value={f.food_id} disabled={f.food_id === foodBId}>
                  {f.food_name} ({f.calories} kcal)
                </option>
              ))}
            </select>

            <div className="comparison-dish-card">
              <img
                src={foodA.image_url}
                alt={foodA.food_name}
                className="comparison-dish-img"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80";
                }}
              />
              <h3>{foodA.food_name}</h3>
              <span className="dish-restaurant">📍 {foodA.restaurant_name}</span>
              <span className="dish-price">₹{foodA.price}</span>
              <button
                className="comparison-add-btn"
                onClick={() => {
                  onAddToCart(foodA);
                  onClose();
                }}
              >
                + Add Dish A to Cart
              </button>
            </div>
          </div>

          <div className="vs-divider">
            <span>VS</span>
          </div>

          {/* Food B Selector */}
          <div className="selector-column column-b">
            <label>Dish B:</label>
            <select
              value={foodBId}
              onChange={(e) => setFoodBId(Number(e.target.value))}
              className="food-select-dropdown"
            >
              {allFoods.map((f) => (
                <option key={f.food_id} value={f.food_id} disabled={f.food_id === foodAId}>
                  {f.food_name} ({f.calories} kcal)
                </option>
              ))}
            </select>

            <div className="comparison-dish-card">
              <img
                src={foodB.image_url}
                alt={foodB.food_name}
                className="comparison-dish-img"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80";
                }}
              />
              <h3>{foodB.food_name}</h3>
              <span className="dish-restaurant">📍 {foodB.restaurant_name}</span>
              <span className="dish-price">₹{foodB.price}</span>
              <button
                className="comparison-add-btn"
                onClick={() => {
                  onAddToCart(foodB);
                  onClose();
                }}
              >
                + Add Dish B to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Nutritional Matrix Table */}
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Nutrient / Metric</th>
                <th>{foodA.food_name}</th>
                <th>{foodB.food_name}</th>
                <th>Dietary Insight</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>🔥 Calories</strong>
                </td>
                <td className={foodA.calories <= foodB.calories ? "winner-stat" : ""}>
                  {foodA.calories} kcal
                </td>
                <td className={foodB.calories <= foodA.calories ? "winner-stat" : ""}>
                  {foodB.calories} kcal
                </td>
                <td>
                  {calDiff !== 0 ? (
                    <span className={calDiff < 0 ? "highlight-good" : "highlight-warn"}>
                      {foodB.food_name} has {Math.abs(calDiff)} {calDiff < 0 ? "fewer" : "more"} kcal
                    </span>
                  ) : (
                    "Equal calories"
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>💪 Protein</strong>
                </td>
                <td className={foodA.protein >= foodB.protein ? "winner-stat" : ""}>
                  {foodA.protein}g
                </td>
                <td className={foodB.protein >= foodA.protein ? "winner-stat" : ""}>
                  {foodB.protein}g
                </td>
                <td>
                  <span className={protDiff > 0 ? "highlight-good" : ""}>
                    {protDiff > 0
                      ? `Dish B has +${protDiff}g extra protein`
                      : protDiff < 0
                      ? `Dish A has +${Math.abs(protDiff)}g extra protein`
                      : "Identical protein"}
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>🌾 Carbohydrates</strong>
                </td>
                <td>{foodA.carbs}g</td>
                <td>{foodB.carbs}g</td>
                <td>
                  {carbsDiff < 0
                    ? `Dish B has ${Math.abs(carbsDiff)}g fewer carbs (lower glycemic load)`
                    : `Dish A has ${carbsDiff}g fewer carbs`}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>🥑 Healthy Fats</strong>
                </td>
                <td>{foodA.fat}g</td>
                <td>{foodB.fat}g</td>
                <td>
                  {fatDiff < 0
                    ? `Dish B has ${Math.abs(fatDiff)}g lower fat content`
                    : `Dish A has ${fatDiff}g lower fat content`}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>🌱 Dietary Fiber</strong>
                </td>
                <td>{foodA.fiber}g</td>
                <td>{foodB.fiber}g</td>
                <td>
                  {fiberDiff > 0
                    ? `Dish B provides +${fiberDiff}g more digestive fiber`
                    : `Dish A provides +${Math.abs(fiberDiff)}g more fiber`}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>⭐ Health Score</strong>
                </td>
                <td>
                  <strong>{foodA.health_rating}</strong> ({foodA.health_label})
                </td>
                <td>
                  <strong>{foodB.health_rating}</strong> ({foodB.health_label})
                </td>
                <td>
                  <span className="verdict-tag">
                    {foodA.health_score >= foodB.health_score
                      ? `Recommended: ${foodA.food_name}`
                      : `Recommended: ${foodB.food_name}`}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* AI Verdict Box */}
        <div className="comparison-verdict-box">
          <div className="verdict-icon">💡</div>
          <div>
            <strong>SmartBite Nutritionist Verdict:</strong>
            <p>
              If your goal is <strong>weight loss and maximum muscle recovery</strong>,{" "}
              <strong>{foodA.protein > foodB.protein ? foodA.food_name : foodB.food_name}</strong> is
              superior with higher protein density. If craving authentic comfort food, both can fit into a
              balanced diet when portion controlled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
