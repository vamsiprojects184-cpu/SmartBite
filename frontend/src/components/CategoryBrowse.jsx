import React from "react";

export const CATEGORIES_DATA = [
  {
    id: "biryani",
    name: "Hyderabadi Biryani",
    icon: "🍲",
    categoryKey: "Biryani",
    tagline: "Iconic Dum Biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "healthy_bowls",
    name: "Healthy Bowls",
    icon: "🥗",
    categoryKey: "Healthy Bowls",
    tagline: "High Protein & Keto",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "south_indian",
    name: "South Indian",
    icon: "🥞",
    categoryKey: "South Indian",
    tagline: "Crisp Dosa & Idlis",
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "starters",
    name: "Tandoori Starters",
    icon: "🍢",
    categoryKey: "Starters",
    tagline: "Chicken 65 & Tikkas",
    image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "haleem",
    name: "Hyderabadi Haleem",
    icon: "🥣",
    categoryKey: "Hyderabadi Special",
    tagline: "Authentic Slow Stew",
    image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "beverages",
    name: "Salads & Smoothies",
    icon: "🥑",
    categoryKey: "Salads",
    tagline: "Fresh Cold-Pressed",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80"
  }
];

export default function CategoryBrowse({ selectedCategory, onSelectCategory }) {
  return (
    <section className="section category-browse-section">
      <div className="section-heading">
        <div>
          <span className="section-label">CURATED HYDERABAD CUISINES</span>
          <h2>Explore What You're Craving</h2>
        </div>
      </div>

      <div className="category-browse-grid">
        {CATEGORIES_DATA.map((cat) => {
          const isSelected = selectedCategory === cat.categoryKey;
          return (
            <div
              key={cat.id}
              className={`category-browse-card ${isSelected ? "selected" : ""}`}
              onClick={() => {
                onSelectCategory(cat.categoryKey);
                const foodsSection = document.getElementById("foods");
                foodsSection?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <div className="category-img-container">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="cat-bg-img"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80";
                  }}
                />
                <span className="category-emoji-badge">{cat.icon}</span>
              </div>
              <div className="category-card-body">
                <h3>{cat.name}</h3>
                <p>{cat.tagline}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
