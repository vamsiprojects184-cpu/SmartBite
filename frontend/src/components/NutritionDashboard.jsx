import React, { useState } from "react";

export default function NutritionDashboard({
  foods = [],
  onSelectFood,
  onAddToCart,
  onOpenCompare,
  onOpenAI
}) {
  const [activeNutriFilter, setActiveNutriFilter] = useState("high_protein"); // "high_protein", "low_calorie", "veg", "smart_choice"
  const [selectedMealFoods, setSelectedMealFoods] = useState([foods[0] || null].filter(Boolean));

  // Filter foods by nutritional objective
  const filteredNutriFoods = foods.filter((f) => {
    if (activeNutriFilter === "high_protein") return f.protein >= 25;
    if (activeNutriFilter === "low_calorie") return f.calories <= 360;
    if (activeNutriFilter === "veg") return f.is_vegetarian;
    if (activeNutriFilter === "smart_choice") return f.health_score >= 85;
    return true;
  });

  // Calculate meal total macros
  const mealCalories = selectedMealFoods.reduce((sum, f) => sum + (f?.calories || 0), 0);
  const mealProtein = selectedMealFoods.reduce((sum, f) => sum + (f?.protein || 0), 0);
  const mealCarbs = selectedMealFoods.reduce((sum, f) => sum + (f?.carbs || 0), 0);
  const mealFat = selectedMealFoods.reduce((sum, f) => sum + (f?.fat || 0), 0);
  const mealFiber = selectedMealFoods.reduce((sum, f) => sum + (f?.fiber || 0), 0);

  // Daily target percentages (assuming standard 2000 kcal, 75g protein target)
  const calPercent = Math.min(100, Math.round((mealCalories / 2000) * 100));
  const protPercent = Math.min(100, Math.round((mealProtein / 75) * 100));

  return (
    <section className="nutrition-dashboard-section" id="nutrition">
      <div className="section-heading">
        <div>
          <span className="section-label">SMARTBITE NUTRITION HUB</span>
          <h2>🥗 Intelligent Nutrition & Macro Tracker</h2>
          <p className="section-subtitle">
            Understand the fuel inside your food. Discover healthier alternatives, high-protein picks,
            and balanced meal swaps.
          </p>
        </div>
        <button className="primary-btn" onClick={onOpenAI}>
          Ask AI Nutritionist 🤖
        </button>
      </div>

      {/* Main Grid: Interactive Macro Calculator + Nutrition Goals */}
      <div className="nutrition-hub-grid">
        {/* Left Card: Meal Macro Visualizer */}
        <div className="macro-calculator-card">
          <div className="calculator-header">
            <h3>📊 Live Meal Macro Breakdown</h3>
            <span className="calorie-badge">{mealCalories} kcal</span>
          </div>

          <p className="calculator-subtitle">
            Select a dish below to visualize its macro balance against a 2,000 kcal daily diet:
          </p>

          <div className="dish-selector-mini">
            <select
              value={selectedMealFoods[0]?.food_id || ""}
              onChange={(e) => {
                const target = foods.find((f) => f.food_id === Number(e.target.value));
                if (target) setSelectedMealFoods([target]);
              }}
              className="macro-food-select"
            >
              {foods.map((f) => (
                <option key={f.food_id} value={f.food_id}>
                  {f.food_name} ({f.calories} kcal • {f.protein}g protein)
                </option>
              ))}
            </select>
          </div>

          {/* Macro Progress Bars */}
          <div className="macro-bars-container">
            <div className="macro-bar-row">
              <div className="macro-bar-labels">
                <span>🔥 Energy ({mealCalories} / 2000 kcal)</span>
                <strong>{calPercent}% of daily limit</strong>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill calories"
                  style={{ width: `${calPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="macro-bar-row">
              <div className="macro-bar-labels">
                <span>💪 Protein ({mealProtein} / 75g)</span>
                <strong style={{ color: "#3e7c35" }}>{protPercent}% of target</strong>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill protein"
                  style={{ width: `${protPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="macro-numbers-pills">
              <div className="macro-pill">
                <span>Carbs</span>
                <strong>{mealCarbs}g</strong>
              </div>
              <div className="macro-pill">
                <span>Fats</span>
                <strong>{mealFat}g</strong>
              </div>
              <div className="macro-pill">
                <span>Fiber</span>
                <strong>{mealFiber}g</strong>
              </div>
              <div className="macro-pill score">
                <span>Score</span>
                <strong>{selectedMealFoods[0]?.health_rating || "8.5/10"}</strong>
              </div>
            </div>
          </div>

          {/* Smart Alternative Recommendation Box */}
          <div className="smart-swap-banner">
            <div className="swap-icon">🔄</div>
            <div>
              <strong>SmartBite Healthy Swap Suggestion:</strong>
              <p>
                Craving traditional Biryani? Swap with the <strong>Grilled Chicken Protein Bowl</strong> or{" "}
                <strong>Paneer Super Bowl</strong> to save 200 kcal and gain 8g additional lean protein!
              </p>
            </div>
          </div>
        </div>

        {/* Right Card: Goal-Based Food Discovery */}
        <div className="goal-discovery-card">
          <div className="discovery-header">
            <h3>🎯 Goal-Oriented Food Filter</h3>
            <div className="nutri-filter-pills">
              <button
                className={`nutri-tab ${activeNutriFilter === "high_protein" ? "active" : ""}`}
                onClick={() => setActiveNutriFilter("high_protein")}
              >
                💪 High Protein (25g+)
              </button>
              <button
                className={`nutri-tab ${activeNutriFilter === "low_calorie" ? "active" : ""}`}
                onClick={() => setActiveNutriFilter("low_calorie")}
              >
                🥗 Low Calorie (&lt;360 kcal)
              </button>
              <button
                className={`nutri-tab ${activeNutriFilter === "veg" ? "active" : ""}`}
                onClick={() => setActiveNutriFilter("veg")}
              >
                🌱 Pure Veg
              </button>
              <button
                className={`nutri-tab ${activeNutriFilter === "smart_choice" ? "active" : ""}`}
                onClick={() => setActiveNutriFilter("smart_choice")}
              >
                ⭐ Top Health Score
              </button>
            </div>
          </div>

          <div className="nutri-dishes-list">
            {filteredNutriFoods.slice(0, 4).map((f) => (
              <div key={f.food_id} className="nutri-dish-row" onClick={() => onSelectFood(f)}>
                <img
                  src={f.image_url}
                  alt={f.food_name}
                  className="nutri-dish-thumb"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="nutri-dish-details">
                  <h4>{f.food_name}</h4>
                  <small>📍 {f.restaurant_name}</small>
                  <div className="nutri-metrics-chips">
                    <span>🔥 {f.calories} kcal</span>
                    <span>💪 {f.protein}g protein</span>
                    <span className="health-score-mini">Score: {f.health_rating}</span>
                  </div>
                </div>

                <div className="nutri-dish-actions">
                  <button
                    className="quick-compare-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCompare(f);
                    }}
                    title="Compare this food"
                  >
                    ⚖️
                  </button>
                  <button
                    className="nutri-cart-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(f);
                    }}
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
