import { useEffect, useState, useRef } from "react";
import "./App.css";
import { apiService } from "./services/api";

// Import modular components
import FoodDetailModal from "./components/FoodDetailModal";
import RestaurantDetailModal from "./components/RestaurantDetailModal";
import FoodComparisonModal from "./components/FoodComparisonModal";
import OrderTrackingModal from "./components/OrderTrackingModal";
import NotificationsPanel from "./components/NotificationsPanel";
import AIAssistantModal from "./components/AIAssistantModal";
import UserProfileModal from "./components/UserProfileModal";
import CheckoutModal from "./components/CheckoutModal";
import NutritionDashboard from "./components/NutritionDashboard";
import CategoryBrowse from "./components/CategoryBrowse";
import TrendingHighlights from "./components/TrendingHighlights";
import CartDrawer from "./components/CartDrawer";

function App() {
  // Core state
  const [restaurants, setRestaurants] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User state
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const saved = localStorage.getItem("smartbite_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Cart state
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("smartbite_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Favorites state
  const [favorites, setFavorites] = useState([]);
  const [favoriteFoodIds, setFavoriteFoodIds] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Modals state
  const [showLogin, setShowLogin] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(
    "Flat 402, Sai Residency, Madhapur, Hyderabad - 500081"
  );
  const [selectedFoodDetail, setSelectedFoodDetail] = useState(null);
  const [selectedRestaurantDetail, setSelectedRestaurantDetail] = useState(null);
  const [compareData, setCompareData] = useState(null); // { foodA, foodB }
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [favToast, setFavToast] = useState("");

  // Voice speech state for main search
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const searchBoxRef = useRef(null);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("smartbite_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Cart save error:", e);
    }
  }, [cart]);

  // Load favorites & notifications when user changes
  useEffect(() => {
    if (loggedInUser) {
      apiService.getFavorites(loggedInUser.user_id).then((favs) => {
        setFavorites(favs || []);
        setFavoriteFoodIds((favs || []).map((item) => Number(item.food_id)));
      });
      apiService.getOrders(loggedInUser.user_id).then(setOrders);
    } else {
      setFavoriteFoodIds([]);
      setFavorites([]);
      setOrders([]);
    }
    setNotifications(apiService.getNotifications(loggedInUser?.user_id));
  }, [loggedInUser]);

  // Load restaurants and foods on mount
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [restaurantData, foodData] = await Promise.all([
        apiService.getRestaurants(),
        apiService.getFoods()
      ]);

      setRestaurants(restaurantData || []);
      setFoods(foodData || []);
    } catch (err) {
      console.error("SmartBite Error:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // Voice search handler
  function handleMainVoiceSearch() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please type your search.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsVoiceSearching(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearch(transcript);
        setIsVoiceSearching(false);
      };

      recognition.onerror = (event) => {
        console.warn("Voice search error:", event.error);
        setIsVoiceSearching(false);
        if (event.error === "not-allowed") {
          alert("Microphone permission was denied.");
        }
      };

      recognition.onend = () => {
        setIsVoiceSearching(false);
      };

      recognition.start();
    } catch (e) {
      console.error("Voice search start error:", e);
      setIsVoiceSearching(false);
    }
  }

  // Execute search and smoothly scroll to food catalog
  function handleExecuteSearch(overrideText) {
    setShowSearchSuggestions(false);
    if (typeof overrideText === "string") {
      setSearch(overrideText);
    }
    setTimeout(() => {
      const foodSection = document.getElementById("foods");
      if (foodSection) {
        foodSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  }

  // Logout
  function handleLogout() {
    setLoggedInUser(null);
    try {
      localStorage.removeItem("smartbite_user");
    } catch (e) {
      console.error("Logout storage error:", e);
    }
    setFavoriteFoodIds([]);
    setFavorites([]);
    setOrders([]);
  }

  // Add to cart
  function addToCart(food, quantity = 1) {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.food_id === food.food_id);
      if (existing) {
        return currentCart.map((item) =>
          item.food_id === food.food_id
            ? { ...item, quantity: (item.quantity || 1) + quantity }
            : item
        );
      }
      return [...currentCart, { ...food, quantity }];
    });
  }

  // Modify quantity from food card
  function updateCartQuantity(foodId, delta) {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.food_id === foodId) {
            const newQty = (item.quantity || 1) + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  }

  // Toggle favorite
  async function handleToggleFavorite(food) {
    if (!loggedInUser) {
      setLoginError("Please login to save favorite dishes to your wishlist.");
      setShowLogin(true);
      return;
    }

    const foodId = Number(food.food_id);
    const isFav = favoriteFoodIds.some((id) => Number(id) === foodId);

    if (isFav) {
      await apiService.removeFavorite(loggedInUser.user_id, foodId);
      setFavoriteFoodIds((cur) => cur.filter((id) => Number(id) !== foodId));
      setFavorites((cur) => cur.filter((f) => Number(f.food_id) !== foodId));
      setFavToast(`Removed "${food.food_name}" from favorites`);
      setTimeout(() => setFavToast(""), 2500);
    } else {
      await apiService.addFavorite(
        loggedInUser.user_id,
        foodId,
        food.restaurant_id || 1
      );
      setFavoriteFoodIds((cur) => [...cur, foodId]);
      const newFav = {
        favorite_id: Date.now(),
        food_id: foodId,
        user_id: Number(loggedInUser.user_id),
        food_name: food.food_name,
        price: food.price,
        image_url: food.image_url,
        restaurant_name: food.restaurant_name || "SmartBite Kitchen",
        calories: food.calories || 350,
        protein: food.protein || 18,
        category: food.category || "Special"
      };
      setFavorites((cur) => [...cur, newFav]);
      setFavToast(`Saved "${food.food_name}" to favorites ❤️`);
      setTimeout(() => setFavToast(""), 2500);
    }
  }

  // Refresh notifications list
  function refreshNotifications() {
    setNotifications(apiService.getNotifications(loggedInUser?.user_id));
  }

  // Natural Language Search & Filtering Logic
  const filteredFoods = foods.filter((food) => {
    const q = (search || "").toLowerCase().trim();
    const name = (food.food_name || "").toLowerCase();
    const desc = (food.description || "").toLowerCase();
    const category = (food.category || "").toLowerCase();
    const restName = (food.restaurant_name || "").toLowerCase();
    const ingredients = Array.isArray(food.ingredients)
      ? food.ingredients.join(" ").toLowerCase()
      : "";

    // 1. If user typed in search bar, search across the ENTIRE food catalog (do not restrict to category)
    if (q) {
      // Smart natural language queries
      if (q === "vegetarian" || q === "veg" || q === "pure veg") {
        return Boolean(food.is_vegetarian);
      }
      if (q === "non-vegetarian" || q === "non veg" || q === "nonveg") {
        return !food.is_vegetarian;
      }
      if (q.includes("high protein") || q === "protein") {
        return (food.protein || 0) >= 20;
      }
      if (q.includes("low calorie") || q.includes("light") || q === "healthy") {
        return (food.calories || 999) <= 450 || (food.health_rating || 0) >= 8.5;
      }
      if (q.includes("under 300") || q.includes("< 300") || q.includes("budget")) {
        return (food.price || 0) <= 300;
      }

      // Match food name, partial name, description, category, restaurant name, ingredients
      return (
        name.includes(q) ||
        desc.includes(q) ||
        category.includes(q) ||
        restName.includes(q) ||
        ingredients.includes(q)
      );
    }

    // 2. If no search text is active, filter by category pill if not "All"
    if (selectedCategory !== "All") {
      const catLower = selectedCategory.toLowerCase();
      if (catLower === "biryani") return category.includes("biryani") || name.includes("biryani");
      if (catLower === "south indian") return category.includes("south indian") || name.includes("dosa") || name.includes("idli") || name.includes("vada");
      if (catLower === "healthy bowls" || catLower === "healthy") return category.includes("healthy") || category.includes("salads") || (food.health_rating || 0) >= 8.5;
      if (catLower === "starters") return category.includes("starters") || category.includes("tikka") || category.includes("65");
      if (catLower === "desserts") return category.includes("dessert") || category.includes("sweet");
      if (catLower === "beverages") return category.includes("beverage") || category.includes("drink") || category.includes("lassi");
      return category.includes(catLower) || name.includes(catLower);
    }

    return true;
  });

  // Search suggestions calculation
  const searchSuggestionsFoods = search.trim().length >= 2
    ? foods.filter((f) => f.food_name.toLowerCase().includes(search.toLowerCase().trim())).slice(0, 3)
    : [];

  const searchSuggestionsRestaurants = search.trim().length >= 2
    ? restaurants.filter((r) => r.name.toLowerCase().includes(search.toLowerCase().trim())).slice(0, 2)
    : [];

  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="smartbite-app">
      {/* ========================================================
          1. STICKY NAVBAR
          ======================================================== */}
      <header className="navbar">
        <div
          className="logo"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ cursor: "pointer" }}
        >
          <span className="logo-icon">●</span>
          <span>
            Smart<span>Bite</span>
          </span>
        </div>

        <nav className={mobileMenuOpen ? "mobile-nav-open" : ""}>
          <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
          <a href="#restaurants" onClick={() => setMobileMenuOpen(false)}>Restaurants</a>
          <a href="#trending" onClick={() => setMobileMenuOpen(false)}>Trending</a>
          <a href="#foods" onClick={() => setMobileMenuOpen(false)}>Food Menu</a>
          <a href="#nutrition" onClick={() => setMobileMenuOpen(false)}>Nutrition Hub</a>
        </nav>

        <div className="nav-actions">

          {/* Orders Icon */}
          <button
            className="nav-icon"
            onClick={async () => {
              if (!loggedInUser) {
                setShowLogin(true);
                return;
              }
              const freshOrders = await apiService.getOrders(loggedInUser.user_id);
              setOrders(freshOrders);
              setShowOrders(true);
            }}
            title="My Orders"
          >
            📋
          </button>

          {/* Favorites Icon */}
          <button
            className="nav-icon"
            onClick={async () => {
              if (!loggedInUser) {
                setShowLogin(true);
                return;
              }
              const freshFavs = await apiService.getFavorites(loggedInUser.user_id);
              setFavorites(freshFavs);
              setShowFavorites(true);
            }}
            title="Favorites"
          >
            ♡
            {favoriteFoodIds.length > 0 && (
              <span className="cart-count" style={{ background: "#dc2626" }}>
                {favoriteFoodIds.length}
              </span>
            )}
          </button>

          {/* Notifications Icon with Unread Badge */}
          <button
            className="nav-icon"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            🔔
            {unreadNotifsCount > 0 && (
              <span className="cart-count">{unreadNotifsCount}</span>
            )}
          </button>

          {/* Cart Icon */}
          <button
            className="nav-icon cart-trigger"
            onClick={() => setShowCart(true)}
            title="Shopping Cart"
          >
            🛒
            {cart.length > 0 && (
              <span className="cart-count">
                {cart.reduce((total, item) => total + (item.quantity || 1), 0)}
              </span>
            )}
          </button>

          {/* User Profile or Login */}
          {loggedInUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                className="login-btn"
                onClick={() => setShowUserProfile(true)}
                title="View Profile & Nutrition Goals"
              >
                Hi, {loggedInUser.name} 👋
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => setShowLogin(true)}>
              Login / Register
            </button>
          )}
        </div>
      </header>

      {/* Floating Favorites Toast Notification */}
      {favToast && (
        <div className="fav-toast-banner" role="alert">
          {favToast}
        </div>
      )}

      {/* Notifications Dropdown */}
      {showNotifications && (
        <NotificationsPanel
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onRefresh={refreshNotifications}
        />
      )}

      {/* ========================================================
          2. HERO SECTION
          ======================================================== */}
      <section className="hero" id="home">
        <div className="hero-content">
          <div className="hero-badge">HYDERABAD FOODTECH • NUTRITION INTELLIGENCE</div>

          <h1>
            Eat authentic.
            <br />
            <span>Live smarter.</span>
          </h1>

          <p>
            Discover legendary Hyderabadi Dum Biryani, crisp Guntur Dosas, and calorie-counted protein bowls.
            Understand your macros and make healthier dining choices every day.
          </p>

          {/* Search Box with Live Autocomplete Suggestions */}
          <div className="search-wrapper-relative" ref={searchBoxRef}>
            <div className="search-box">
              <span>⌕</span>
              <input
                type="text"
                placeholder='Search biryani, chicken, paneer, burger, healthy...'
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleExecuteSearch();
                  }
                }}
                onFocus={() => setShowSearchSuggestions(true)}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{ background: "none", color: "#888", fontSize: "16px", padding: "0 8px" }}
                >
                  ✕
                </button>
              )}

              <button
                type="button"
                className={`mic-button ${isVoiceSearching ? "listening" : ""}`}
                onClick={handleMainVoiceSearch}
                title="Voice Search"
                style={{ marginRight: "6px" }}
              >
                {isVoiceSearching ? "🔴" : "🎙️"}
              </button>

              <button type="button" onClick={() => handleExecuteSearch()}>Search</button>
            </div>

            {/* Real-time Autocomplete Suggestions Dropdown */}
            {showSearchSuggestions && (searchSuggestionsFoods.length > 0 || searchSuggestionsRestaurants.length > 0) && (
              <div className="search-suggestions-dropdown">
                {searchSuggestionsFoods.length > 0 && (
                  <div>
                    <div className="suggestion-group-title">Dishes & Meals</div>
                    {searchSuggestionsFoods.map((f) => (
                      <div
                        key={f.food_id}
                        className="suggestion-item"
                        onClick={() => {
                          setSelectedFoodDetail(f);
                          setShowSearchSuggestions(false);
                        }}
                      >
                        <img src={f.image_url} alt={f.food_name} className="suggestion-thumb" />
                        <div className="suggestion-details">
                          <strong>{f.food_name}</strong>
                          <small>📍 {f.restaurant_name} • 🔥 {f.calories} kcal</small>
                        </div>
                        <span className="suggestion-price">₹{f.price}</span>
                      </div>
                    ))}
                  </div>
                )}

                {searchSuggestionsRestaurants.length > 0 && (
                  <div>
                    <div className="suggestion-group-title">Restaurants in Hyderabad</div>
                    {searchSuggestionsRestaurants.map((r) => (
                      <div
                        key={r.restaurant_id}
                        className="suggestion-item"
                        onClick={() => {
                          setSelectedRestaurantDetail(r);
                          setShowSearchSuggestions(false);
                        }}
                      >
                        <img src={r.image_url} alt={r.name} className="suggestion-thumb" />
                        <div className="suggestion-details">
                          <strong>{r.name}</strong>
                          <small>📍 {r.city} • ★ {r.rating}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Filter Buttons */}
          <div className="food-filters" style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              className={search === "" ? "active-filter-btn" : ""}
              onClick={() => handleExecuteSearch("")}
            >
              All Items
            </button>
            <button
              type="button"
              className={search === "vegetarian" ? "active-filter-btn" : ""}
              onClick={() => handleExecuteSearch("vegetarian")}
            >
              🥗 Pure Veg
            </button>
            <button
              type="button"
              className={search === "non-vegetarian" ? "active-filter-btn" : ""}
              onClick={() => handleExecuteSearch("non-vegetarian")}
            >
              🍗 Non-Veg
            </button>
            <button
              type="button"
              className={search === "high protein" ? "active-filter-btn" : ""}
              onClick={() => handleExecuteSearch("high protein")}
            >
              💪 High Protein (25g+)
            </button>
            <button
              type="button"
              className={search === "biryani" ? "active-filter-btn" : ""}
              onClick={() => handleExecuteSearch("biryani")}
            >
              🔥 Hyderabad Biryani
            </button>
            <button
              type="button"
              className={search === "low calorie" ? "active-filter-btn" : ""}
              onClick={() => handleExecuteSearch("low calorie")}
            >
              🥑 Low Calorie
            </button>
          </div>

          <div className="hero-buttons" style={{ marginTop: "24px" }}>
            <a href="#restaurants" className="primary-btn">
              Explore Hyderabad Kitchens ↓
            </a>
            <button className="secondary-btn" onClick={() => setShowAIAssistant(true)}>
              🤖 Ask AI Nutritionist
            </button>
            <button
              className="secondary-btn"
              onClick={() =>
                setCompareData({ foodA: foods[0], foodB: foods[4] || foods[1] })
              }
            >
              ⚖️ Compare Foods
            </button>
          </div>

          <div className="hero-features" style={{ marginTop: "30px" }}>
            <span>✓ Verified Calorie & Protein Counts</span>
            <span>✓ Iconic Hyderabad Restaurants</span>
            <span>✓ AI-Powered Healthy Swaps</span>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div className="hero-visual">
          <div className="food-circle">
            <div className="food-placeholder">
              <span>🍗</span>
            </div>
          </div>

          <div className="nutrition-card">
            <small>SMART CHOICE OF THE DAY</small>
            <strong>Grilled Chicken Protein Bowl</strong>
            <div className="nutrition-line">
              <span>Protein</span>
              <b style={{ color: "#059669" }}>42g (Ultra High)</b>
            </div>
            <div className="nutrition-line">
              <span>Calories</span>
              <b>380 kcal</b>
            </div>
            <div className="nutrition-line">
              <span>Health Score</span>
              <b style={{ color: "#ef6c2f" }}>9.5 / 10 ★</b>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. CATEGORY BROWSE SECTION (Curated Cuisines)
          ======================================================== */}
      <CategoryBrowse
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* ========================================================
          4. TRENDING HIGHLIGHTS & RECOMMENDATIONS
          ======================================================== */}
      <div id="trending">
        <TrendingHighlights
          foods={foods}
          onSelectFood={(f) => setSelectedFoodDetail(f)}
          onAddToCart={(f) => addToCart(f)}
          onOpenCompare={(f) =>
            setCompareData({
              foodA: f,
              foodB: foods.find((item) => item.food_id !== f.food_id) || foods[0]
            })
          }
          cart={cart}
        />
      </div>

      {/* ========================================================
          5. FEATURES ROW
          ======================================================== */}
      <section className="features-section">
        <div className="feature">
          <div className="feature-icon">🥗</div>
          <div>
            <h3>Nutrition Intelligence</h3>
            <p>Accurate macros, protein, carbs & fiber</p>
          </div>
        </div>

        <div className="feature" onClick={() => setShowAIAssistant(true)} style={{ cursor: "pointer" }}>
          <div className="feature-icon">🤖</div>
          <div>
            <h3>AI Diet Assistant</h3>
            <p>Voice-enabled food recommendations</p>
          </div>
        </div>

        <div className="feature">
          <div className="feature-icon">🍴</div>
          <div>
            <h3>Hyderabad Icons</h3>
            <p>Paradise, Bawarchi, Chutneys & Pista House</p>
          </div>
        </div>

        <div
          className="feature"
          onClick={() => {
            const el = document.getElementById("nutrition");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          style={{ cursor: "pointer" }}
        >
          <div className="feature-icon">⚡</div>
          <div>
            <h3>Smart Macro Tracking</h3>
            <p>Real-time protein, calorie & macro totals</p>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. POPULAR RESTAURANTS
          ======================================================== */}
      <section className="section" id="restaurants">
        <div className="section-heading">
          <div>
            <span className="section-label">TOP DINING DESTINATIONS</span>
            <h2>Hyderabad's Most Popular Restaurants</h2>
          </div>
          <button
            className="view-btn"
            onClick={() => {
              const el = document.getElementById("restaurants");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            All Kitchens ({restaurants.length})
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading top Hyderabad restaurants...</div>
        ) : (
          <div className="restaurant-grid">
            {restaurants.map((restaurant) => (
              <div
                className="restaurant-card"
                key={restaurant.restaurant_id}
                onClick={() => setSelectedRestaurantDetail(restaurant)}
                style={{ cursor: "pointer" }}
              >
                <div className="restaurant-image">
                  <img
                    src={restaurant.image_url}
                    alt={restaurant.name}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80";
                    }}
                  />
                  <div className="restaurant-image-overlay">
                    <span>★ {restaurant.rating || "4.8"}</span>
                  </div>
                </div>

                <div className="restaurant-info">
                  <h3>{restaurant.name}</h3>
                  <p>{restaurant.description}</p>

                  <div className="restaurant-location">
                    <span>📍 {restaurant.city || "Hyderabad"}</span>
                    <span style={{ float: "right", color: "#ef6c2f", fontWeight: "600" }}>
                      ⏱️ {restaurant.delivery_time || "30 min"}
                    </span>
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <button
                      className="restaurant-btn"
                      style={{ width: "100%" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRestaurantDetail(restaurant);
                      }}
                    >
                      Explore Menu & Reviews →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================
          7. FOOD CATALOG & CATEGORIES
          ======================================================== */}
      <section className="section food-section" id="foods">
        <div className="section-heading">
          <div>
            <span className="section-label">SIGNATURE DISHES</span>
            <h2>
              {search
                ? `Results for "${search}" (${filteredFoods.length})`
                : "Popular Dishes & SmartBites"}
            </h2>
          </div>
        </div>

        {/* Category Pills */}
        <div className="categories-pills-bar" style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "14px", marginBottom: "25px" }}>
          {[
            "All",
            "Biryani",
            "Healthy Bowls",
            "South Indian",
            "Starters",
            "Hyderabadi Special",
            "Salads",
            "Beverages",
            "Desserts"
          ].map((cat) => (
            <button
              key={cat}
              className={`filter-chip ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading">Loading dishes and nutrition information...</div>
        ) : filteredFoods.length === 0 ? (
          <div className="no-food-found-card">
            <span style={{ fontSize: "44px" }}>🔍</span>
            <h3>No food found</h3>
            <p>
              We couldn't find any dishes matching "{search}".
              Try searching for "biryani", "chicken", "paneer", "burger", "healthy", or "pizza".
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "14px" }}>
              <button
                className="primary-btn"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                }}
              >
                Clear Search & Show All
              </button>
              <button
                type="button"
                className="quick-suggest-btn"
                onClick={() => handleExecuteSearch("biryani")}
              >
                Try "Biryani"
              </button>
              <button
                type="button"
                className="quick-suggest-btn"
                onClick={() => handleExecuteSearch("chicken")}
              >
                Try "Chicken"
              </button>
              <button
                type="button"
                className="quick-suggest-btn"
                onClick={() => handleExecuteSearch("paneer")}
              >
                Try "Paneer"
              </button>
              <button
                type="button"
                className="quick-suggest-btn"
                onClick={() => handleExecuteSearch("burger")}
              >
                Try "Burger"
              </button>
            </div>
          </div>
        ) : (
          <div className="food-grid">
            {filteredFoods.map((food) => {
              const isFav = favoriteFoodIds.some(
                (id) => Number(id) === Number(food.food_id)
              );
              const inCartItem = cart.find(
                (item) => Number(item.food_id) === Number(food.food_id)
              );

              return (
                <div
                  className="food-card"
                  key={food.food_id}
                  onClick={() => setSelectedFoodDetail(food)}
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
                      {food.is_vegetarian ? "🌱 VEGETARIAN" : "🍗 NON-VEG"}
                    </div>

                    <button
                      className="favorite-btn"
                      style={{ color: isFav ? "#ef4444" : "#9ca3af" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(food);
                      }}
                      title={isFav ? "Remove Favorite" : "Add Favorite"}
                    >
                      {isFav ? "❤️" : "♡"}
                    </button>
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
                        ★ {food.health_rating}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {/* Swiggy/Zomato style in-card cart quantity controls */}
                      {inCartItem ? (
                        <div
                          className="card-qty-control"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => updateCartQuantity(food.food_id, -1)}
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <span>{inCartItem.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(food.food_id, 1)}
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          className="add-cart-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(food);
                          }}
                        >
                          + Add to Cart
                        </button>
                      )}

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
                          setCompareData({
                            foodA: food,
                            foodB: foods.find((f) => f.food_id !== food.food_id) || foods[0]
                          });
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
        )}
      </section>

      {/* ========================================================
          8. NUTRITION DASHBOARD SECTION
          ======================================================== */}
      <NutritionDashboard
        foods={foods}
        onSelectFood={(f) => setSelectedFoodDetail(f)}
        onAddToCart={(f) => addToCart(f)}
        onOpenCompare={(f) =>
          setCompareData({
            foodA: f,
            foodB: foods.find((item) => item.food_id !== f.food_id) || foods[0]
          })
        }
        onOpenAI={() => setShowAIAssistant(true)}
      />

      {/* ========================================================
          9. FLOATING AI ASSISTANT BUTTON
          ======================================================== */}
      <button
        className="floating-ai-trigger"
        onClick={() => setShowAIAssistant(true)}
        title="Open SmartBite AI Assistant"
      >
        <span>🤖</span> Ask AI Nutritionist
      </button>

      {/* ========================================================
          10. FOOTER
          ======================================================== */}
      <footer>
        <div className="footer-logo">
          Smart<span>Bite</span> FoodTech
        </div>
        <p>
          Hyderabad's Premier FoodTech & Nutrition Intelligence Platform. Powered by React, Spring Boot,
          Python AI & MySQL.
        </p>

        <div className="footer-links">
          <a href="#home">Home</a>
          <a href="#restaurants">Restaurants</a>
          <a href="#trending">Trending</a>
          <a href="#foods">Food Menu</a>
          <a href="#nutrition">Nutrition Hub</a>
          <a
            href="#favorites"
            onClick={(e) => {
              e.preventDefault();
              if (!loggedInUser) {
                setLoginError("Please login to view your favorites.");
                setShowLogin(true);
              } else {
                setShowFavorites(true);
              }
            }}
          >
            My Favorites ({favoriteFoodIds.length})
          </a>
          <a
            href="#orders"
            onClick={(e) => {
              e.preventDefault();
              if (!loggedInUser) {
                setLoginError("Please login to view your orders.");
                setShowLogin(true);
              } else {
                setShowOrders(true);
              }
            }}
          >
            Order History
          </a>
        </div>

        <div className="copyright">
          © 2026 SmartBite FoodTech India Pvt Ltd. All rights reserved. Hyderabad, Telangana.
        </div>
      </footer>

      {/* ========================================================
          12. ALL MODALS & INTERACTIVE OVERLAYS
          ======================================================== */}

      {/* Food Detail Modal */}
      {selectedFoodDetail && (
        <FoodDetailModal
          food={selectedFoodDetail}
          onClose={() => setSelectedFoodDetail(null)}
          onAddToCart={(food, qty) => addToCart(food, qty)}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={favoriteFoodIds.some(
            (id) => Number(id) === Number(selectedFoodDetail.food_id)
          )}
          onOpenCompare={(food) => {
            setSelectedFoodDetail(null);
            setCompareData({
              foodA: food,
              foodB: foods.find((f) => f.food_id !== food.food_id) || foods[0]
            });
          }}
          onSelectFood={(f) => setSelectedFoodDetail(f)}
        />
      )}

      {/* Restaurant Detail Modal */}
      {selectedRestaurantDetail && (
        <RestaurantDetailModal
          restaurant={selectedRestaurantDetail}
          foods={foods}
          onClose={() => setSelectedRestaurantDetail(null)}
          onAddToCart={(f) => addToCart(f)}
          onSelectFood={(f) => setSelectedFoodDetail(f)}
          onToggleFavorite={handleToggleFavorite}
          favoriteFoodIds={favoriteFoodIds}
        />
      )}

      {/* Food Comparison Modal */}
      {compareData && (
        <FoodComparisonModal
          initialFoodA={compareData.foodA}
          initialFoodB={compareData.foodB}
          allFoods={foods}
          onClose={() => setCompareData(null)}
          onAddToCart={(f) => addToCart(f)}
        />
      )}

      {/* Order Tracking Modal */}
      {trackingOrderId && (
        <OrderTrackingModal
          orderId={trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
        />
      )}

      {/* AI Nutrition Assistant Modal */}
      {showAIAssistant && (
        <AIAssistantModal
          foods={foods}
          onClose={() => setShowAIAssistant(false)}
          onAddToCart={(f) => addToCart(f)}
          onSelectFood={(f) => setSelectedFoodDetail(f)}
        />
      )}

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfileModal
          user={loggedInUser}
          orders={orders}
          onClose={() => setShowUserProfile(false)}
          onLogout={handleLogout}
          onTrackOrder={(orderId) => {
            setTrackingOrderId(orderId);
          }}
        />
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
          loggedInUser={loggedInUser}
          onClose={() => setShowCheckout(false)}
          onOrderSuccess={(createdOrder) => {
            setCart([]);
            setShowCheckout(false);
            setTrackingOrderId(createdOrder.order_id);
            refreshNotifications();
            if (loggedInUser) {
              apiService.getOrders(loggedInUser.user_id).then(setOrders);
            }
          }}
          onOpenLogin={() => setShowLogin(true)}
        />
      )}

      {/* ========================================================
          13. AUTH MODALS (LOGIN & REGISTER)
          ======================================================== */}
      {showLogin && (
        <div className="auth-overlay" onClick={() => setShowLogin(false)}>
          <div className="auth-box" onClick={(e) => e.stopPropagation()}>
            <button className="auth-close" onClick={() => { setShowLogin(false); setLoginError(""); }}>
              ×
            </button>
            <h2>Welcome Back 👋</h2>
            <p>Login to your SmartBite FoodTech account</p>

            {loginError && (
              <div
                className="auth-error-banner"
                style={{
                  background: "#fee2e2",
                  color: "#b91c1c",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  marginBottom: "14px",
                  fontSize: "14px",
                  lineHeight: "1.4"
                }}
              >
                ⚠️ {loginError}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoginError("");
                const email = e.target.email.value;
                const password = e.target.password.value;

                try {
                  const res = await apiService.login(email, password);
                  if (res.success && res.user) {
                    setLoggedInUser(res.user);
                    setLoginError("");
                    setShowLogin(false);
                  } else {
                    setLoginError(res.message || "Invalid email or password. Please try again.");
                  }
                } catch (err) {
                  setLoginError(err.message || "Login failed. Please check your credentials.");
                }
              }}
            >
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                required
              />
              <button type="submit" className="auth-submit">
                Login
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setShowLogin(false);
                  setShowRegister(true);
                }}
              >
                Register Now
              </button>
            </p>
          </div>
        </div>
      )}

      {showRegister && (
        <div className="auth-overlay" onClick={() => setShowRegister(false)}>
          <div className="auth-box" onClick={(e) => e.stopPropagation()}>
            <button className="auth-close" onClick={() => setShowRegister(false)}>
              ×
            </button>
            <h2>Create Account ✨</h2>
            <p>Join SmartBite FoodTech today</p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const name = e.target.name.value;
                const email = e.target.email.value;
                const phone = e.target.phone.value;
                const password = e.target.password.value;

                try {
                  const res = await apiService.register({ name, email, phone, password });
                  if (res.success) {
                    alert("Account created successfully! 🎉 Please login.");
                    setShowRegister(false);
                    setShowLogin(true);
                  }
                } catch (err) {
                  alert(err.message || "Registration failed");
                }
              }}
            >
              <input type="text" name="name" placeholder="Full Name" required />
              <input type="email" name="email" placeholder="Email Address" required />
              <input type="tel" name="phone" placeholder="Phone Number" required />
              <input type="password" name="password" placeholder="Create Password" required />
              <button type="submit" className="auth-submit">
                Create Account
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setShowRegister(false);
                  setShowLogin(true);
                }}
              >
                Login
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ========================================================
          14. CART DRAWER (Core logic active; final visual polish in RUN 3)
          ======================================================== */}
      {showCart && (
        <CartDrawer
          cart={cart}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={updateCartQuantity}
          onRemoveItem={(foodId) =>
            setCart((currentCart) => currentCart.filter((item) => item.food_id !== foodId))
          }
          onClearCart={() => setCart([])}
          onProceedToCheckout={() => {
            setShowCart(false);
            setShowCheckout(true);
          }}
        />
      )}

      {/* ========================================================
          15. ORDERS MODAL
          ======================================================== */}
      {showOrders && (
        <div className="orders-overlay" onClick={() => setShowOrders(false)}>
          <div className="orders-box" onClick={(e) => e.stopPropagation()}>
            <button className="orders-close" onClick={() => setShowOrders(false)}>
              ×
            </button>
            <h2>📋 My Orders</h2>

            {orders.length === 0 ? (
              <p>You haven't placed any orders yet.</p>
            ) : (
              orders.map((order) => (
                <div className="order-item" key={order.order_id}>
                  <div>
                    <strong>Order #{order.order_id}</strong>
                    <p>🍴 {order.restaurant_name || "SmartBite Restaurant"}</p>
                    <p>Total: ₹{order.total_amount}</p>
                    <p>Status: {order.order_status || "Confirmed"}</p>
                    <small>{order.order_date || "Recent"}</small>
                  </div>
                  <button
                    className="track-cta-btn"
                    onClick={() => {
                      setShowOrders(false);
                      setTrackingOrderId(order.order_id);
                    }}
                    style={{ marginTop: "10px" }}
                  >
                    Track Delivery 🛵
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          16. FAVORITES DRAWER
          ======================================================== */}
      {showFavorites && (
        <div className="favorites-overlay" onClick={() => setShowFavorites(false)}>
          <div className="favorites-box" onClick={(e) => e.stopPropagation()}>
            <div className="favorites-header">
              <h2>❤️ Your Favorites ({favorites.length})</h2>
              <button
                className="favorites-close"
                onClick={() => setShowFavorites(false)}
                aria-label="Close Favorites"
              >
                ×
              </button>
            </div>

            {favorites.length === 0 ? (
              <div className="empty-favorites-view" style={{ textAlign: "center", padding: "50px 20px" }}>
                <span style={{ fontSize: "52px", display: "block", marginBottom: "12px" }}>♡</span>
                <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>No favorite dishes yet</h3>
                <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.5", marginBottom: "20px" }}>
                  Explore Hyderabad's signature dishes, protein bowls, and healthy meals. Click the ❤️ icon on any dish to save it here.
                </p>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    setShowFavorites(false);
                    const el = document.getElementById("foods");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Explore Food Menu
                </button>
              </div>
            ) : (
              <div className="favorites-list">
                {favorites.map((item) => {
                  const targetFood =
                    foods.find((f) => Number(f.food_id) === Number(item.food_id)) || item;

                  return (
                    <div className="favorite-card-row" key={item.food_id || item.favorite_id}>
                      <img
                        src={targetFood.image_url || item.image_url}
                        alt={item.food_name}
                        className="favorite-thumb-img"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80";
                        }}
                      />

                      <div className="favorite-meta-content">
                        <h4>{item.food_name}</h4>
                        <div className="fav-dish-sub">
                          <span>📍 {targetFood.restaurant_name || "SmartBite"}</span>
                          <strong className="fav-price">₹{item.price}</strong>
                        </div>
                        {targetFood.calories && (
                          <div className="fav-nutrition-tags">
                            <span>🔥 {targetFood.calories} kcal</span>
                            <span>💪 {targetFood.protein}g protein</span>
                          </div>
                        )}

                        <div className="fav-actions-row">
                          <button
                            type="button"
                            className="fav-add-cart-btn"
                            onClick={() => {
                              addToCart(targetFood);
                              setFavToast(`Added "${item.food_name}" to cart 🛒`);
                              setTimeout(() => setFavToast(""), 2000);
                            }}
                          >
                            + Add to Cart
                          </button>
                          <button
                            type="button"
                            className="fav-remove-action-btn"
                            onClick={() => handleToggleFavorite(targetFood)}
                            title="Remove from favorites"
                          >
                            Remove ❤️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;