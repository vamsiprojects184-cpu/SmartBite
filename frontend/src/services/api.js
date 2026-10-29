export const API_BASE_URL = "http://127.0.0.1:5000";
export const SPRING_BOOT_BASE_URL = "http://localhost:8080";

// Helper for local storage persistence
function getStored(key, defaultVal) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch (e) {
    console.warn(`LocalStorage read error for ${key}:`, e);
    return defaultVal;
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn(`LocalStorage write error for ${key}:`, e);
  }
}

// Initialize default state
export function initLocalData() {
  if (!getStored("smartbite_notifications", null)) {
    setStored("smartbite_notifications", [
      {
        id: "notif-1",
        title: "Welcome to SmartBite! 🥗",
        message: "Explore healthy, calorie-counted meals from top restaurants.",
        time: "Just now",
        is_read: false,
        type: "welcome"
      }
    ]);
  }
}

// Auto-run initialization
initLocalData();

export const apiService = {
  // 1. RESTAURANTS
  async getRestaurants() {
    try {
      const res = await fetch(`${API_BASE_URL}/restaurants`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (e) {
      console.warn("Backend /restaurants unavailable:", e.message);
    }
    return getStored("smartbite_restaurants", []);
  },

  // 2. FOODS
  async getFoods() {
    try {
      const res = await fetch(`${API_BASE_URL}/foods`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data.map((f) => ({
            ...f,
            image_url:
              f.image_url && f.image_url.startsWith("http")
                ? f.image_url
                : `${API_BASE_URL}/images/${f.image_url}`
          }));
        }
      }
    } catch (e) {
      console.warn("Backend /foods unavailable:", e.message);
    }
    return getStored("smartbite_foods", []);
  },

  // 3. AUTH: LOGIN
  async login(email, password) {
    if (!email || !password) {
      return { success: false, message: "Please enter both email and password." };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.user) {
        setStored("smartbite_user", data.user);
        return { success: true, user: data.user };
      }

      if (!res.ok) {
        return {
          success: false,
          message: data.message || "Invalid email or password. Please check your credentials."
        };
      }
    } catch (e) {
      console.warn("Backend /login network error:", e.message);
      return {
        success: false,
        message: "Cannot connect to SmartBite backend server. Please ensure the backend is running."
      };
    }
  },

  // 4. AUTH: REGISTER
  async register(userData) {
    if (!userData.email || !userData.password) {
      return { success: false, message: "Please fill in all required fields." };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: data.message || "Registration successful! You can now login.", user: data.user };
      }
      return {
        success: false,
        message: data.message || "Registration failed on server. Please try a different email."
      };
    } catch (e) {
      console.warn("Backend /register error:", e.message);
      return {
        success: false,
        message: "Cannot connect to SmartBite backend server. Please ensure the backend is running."
      };
    }
  },

  // 5. FAVORITES
  async getFavorites(userId) {
    if (!userId) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/favorites/${userId}`);
      if (res.ok) {
        const data = await res.json().catch(() => []);
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.warn("Backend /favorites unavailable:", e.message);
    }
    const local = getStored("smartbite_favorites", []);
    return local.filter((f) => Number(f.user_id) === Number(userId));
  },

  async addFavorite(userId, foodId, restaurantId) {
    if (!userId) return { success: false };
    const numUserId = Number(userId);
    const numFoodId = Number(foodId);
    try {
      const res = await fetch(`${API_BASE_URL}/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: numUserId, food_id: numFoodId, restaurant_id: restaurantId || 1 })
      });
      if (res.ok) return { success: true };
    } catch (e) {
      console.warn("Backend /favorites POST error:", e.message);
    }
    const local = getStored("smartbite_favorites", []);
    const foods = getStored("smartbite_foods", []);
    const targetFood = foods.find((f) => Number(f.food_id) === numFoodId);
    if (!local.some((f) => Number(f.user_id) === numUserId && Number(f.food_id) === numFoodId)) {
      local.push({
        favorite_id: Date.now(),
        user_id: numUserId,
        food_id: numFoodId,
        restaurant_id: restaurantId || 1,
        food_name: targetFood ? targetFood.food_name : "Food Item",
        price: targetFood ? targetFood.price : 0,
        image_url: targetFood?.image_url,
        restaurant_name: targetFood?.restaurant_name || "Restaurant",
        calories: targetFood?.calories || 0,
        protein: targetFood?.protein || 0,
        category: targetFood?.category || "Special"
      });
      setStored("smartbite_favorites", local);
    }
    return { success: true };
  },

  async removeFavorite(userId, foodId) {
    if (!userId) return { success: false };
    const numUserId = Number(userId);
    const numFoodId = Number(foodId);
    try {
      const res = await fetch(`${API_BASE_URL}/favorites/${numUserId}/${numFoodId}`, {
        method: "DELETE"
      });
      if (res.ok) return { success: true };
    } catch (e) {
      console.warn("Backend /favorites DELETE error:", e.message);
    }
    const local = getStored("smartbite_favorites", []);
    const filtered = local.filter((f) => !(Number(f.user_id) === numUserId && Number(f.food_id) === numFoodId));
    setStored("smartbite_favorites", filtered);
    return { success: true };
  },

  // 6. ORDERS
  async getOrders(userId) {
    if (!userId) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${userId}`);
      if (res.ok) {
        const data = await res.json().catch(() => []);
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.warn("Backend /orders unavailable:", e.message);
    }
    const localOrders = getStored("smartbite_orders", []);
    return localOrders.filter((o) => o.user_id === userId);
  },

  async createOrder(orderPayload) {
    let createdOrder = null;
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });
      if (res.ok) {
        const data = await res.json();
        createdOrder = data;
      }
    } catch (e) {
      console.warn("Backend /orders POST error:", e.message);
    }

    const orderId = createdOrder?.order_id || Math.floor(100000 + Math.random() * 900000);
    const newOrder = {
      order_id: orderId,
      user_id: orderPayload.user_id,
      restaurant_id: orderPayload.restaurant_id,
      restaurant_name: orderPayload.restaurant_name || "SmartBite Partner Restaurant",
      delivery_address: orderPayload.delivery_address,
      total_amount: orderPayload.total_amount,
      items: orderPayload.items || [],
      order_status: "Confirmed",
      order_date: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      estimated_delivery_time: "25-30 minutes",
      payment_method: orderPayload.payment_method || "UPI / Digital"
    };

    const localOrders = getStored("smartbite_orders", []);
    localOrders.unshift(newOrder);
    setStored("smartbite_orders", localOrders);

    this.addNotification({
      title: `Order #${orderId} Placed! 🛵`,
      message: `Your meal has been confirmed and is being prepared by the restaurant.`,
      type: "order"
    });

    return { success: true, order: newOrder };
  },

  // 7. ORDER TRACKING
  async getOrderTracking(orderId) {
    const localOrders = getStored("smartbite_orders", []);
    const order = localOrders.find((o) => String(o.order_id) === String(orderId));
    if (!order) {
      return {
        order_id: orderId,
        status: "Confirmed",
        step: 2,
        stages: [
          { name: "Order Placed", completed: true, time: "Just now" },
          { name: "Confirmed by Restaurant", completed: true, time: "1 min ago" },
          { name: "Preparing Food", completed: false, time: "Estimated 10 mins" },
          { name: "Out for Delivery", completed: false, time: "Estimated 20 mins" },
          { name: "Delivered", completed: false, time: "Estimated 30 mins" }
        ],
        delivery_partner: {
          name: "Delivery Partner",
          phone: "+91 98765 43210",
          vehicle: "Delivery Vehicle"
        }
      };
    }

    return {
      order_id: order.order_id,
      status: order.order_status || "Confirmed",
      step: 3,
      restaurant_name: order.restaurant_name,
      delivery_address: order.delivery_address,
      total_amount: order.total_amount,
      items: order.items,
      estimated_delivery_time: order.estimated_delivery_time || "25 mins",
      stages: [
        { name: "Order Placed", completed: true, time: "Placed successfully" },
        { name: "Restaurant Confirmed", completed: true, time: "Kitchen notified" },
        { name: "Freshly Preparing", completed: true, time: "Cooking with care" },
        { name: "Out for Delivery", completed: false, time: "Valet assigned" },
        { name: "Delivered", completed: false, time: "Enjoy your SmartBite!" }
      ],
      delivery_partner: {
        name: "Delivery Partner",
        phone: "+91 98765 43210",
        vehicle: "Electric Bike",
        rating: "4.9 ★"
      }
    };
  },

  // 8. TABLE BOOKING
  async createTableBooking(bookingData) {
    let createdBooking = null;
    try {
      const res = await fetch(`${API_BASE_URL}/table-bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.booking) {
          createdBooking = data.booking;
        }
      }
    } catch (e) {
      console.warn("Backend /table-bookings POST error, falling back to local store:", e.message);
    }

    const bookingId = createdBooking?.booking_id || "TB-" + Math.floor(1000 + Math.random() * 9000);
    const newBooking = {
      booking_id: bookingId,
      restaurant_id: bookingData.restaurant_id,
      restaurant_name: bookingData.restaurant_name || "SmartBite Dining",
      user_id: bookingData.user_id || 1,
      guest_name: bookingData.guest_name,
      guest_phone: bookingData.guest_phone,
      guests_count: bookingData.guests_count || 2,
      booking_date: bookingData.booking_date,
      booking_time: bookingData.booking_time,
      seating_area: bookingData.seating_area || "Indoor AC",
      occasion: bookingData.occasion || "Casual Dining",
      special_requests: bookingData.special_requests || "None",
      status: "Confirmed",
      created_at: new Date().toLocaleDateString("en-IN")
    };

    const local = getStored("smartbite_bookings", []);
    local.unshift(newBooking);
    setStored("smartbite_bookings", local);

    this.addNotification({
      title: `Table Reserved at ${newBooking.restaurant_name}! 🍽️`,
      message: `Confirmed for ${newBooking.guests_count} guests on ${newBooking.booking_date} at ${newBooking.booking_time}. Booking ID: ${bookingId}`,
      type: "booking"
    });

    return { success: true, booking: newBooking };
  },

  async getTableBookings(userId) {
    if (userId) {
      try {
        const res = await fetch(`${API_BASE_URL}/table-bookings/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setStored("smartbite_bookings", data);
            return data;
          }
        }
      } catch (e) {
        console.warn("Backend /table-bookings GET error, using local:", e.message);
      }
    }
    const local = getStored("smartbite_bookings", []);
    return userId ? local.filter((b) => Number(b.user_id) === Number(userId)) : local;
  },

  async cancelTableBooking(bookingId) {
    const local = getStored("smartbite_bookings", []);
    const updated = local.map((b) => (b.booking_id === bookingId ? { ...b, status: "Cancelled" } : b));
    setStored("smartbite_bookings", updated);
    this.addNotification({
      title: `Booking #${bookingId} Cancelled`,
      message: `Your table reservation has been successfully cancelled.`,
      type: "general"
    });
    return { success: true };
  },

  // 9. NOTIFICATIONS
  getNotifications(userId) {
    return getStored("smartbite_notifications", []);
  },

  addNotification(notif) {
    const notifs = getStored("smartbite_notifications", []);
    notifs.unshift({
      id: "notif-" + Date.now(),
      title: notif.title,
      message: notif.message,
      time: "Just now",
      is_read: false,
      type: notif.type || "general"
    });
    setStored("smartbite_notifications", notifs);
  },

  markNotificationRead(id) {
    const notifs = getStored("smartbite_notifications", []);
    const updated = notifs.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    setStored("smartbite_notifications", updated);
  },

  clearAllNotifications() {
    setStored("smartbite_notifications", []);
  },

  // 10. CUSTOMER SUPPORT
  async submitSupportTicket(ticket) {
    let createdTicket = null;
    try {
      const res = await fetch(`${API_BASE_URL}/support-tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticket)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ticket) {
          createdTicket = data.ticket;
        }
      }
    } catch (e) {
      console.warn("Backend /support-tickets POST error, falling back to local:", e.message);
    }

    const ticketId = createdTicket?.ticket_id || "TKT-" + Math.floor(10000 + Math.random() * 90000);
    const newTicket = {
      ticket_id: ticketId,
      user_id: ticket.user_id || 1,
      category: ticket.category || "General Inquiry",
      subject: ticket.subject,
      description: ticket.description,
      order_id: ticket.order_id || null,
      priority: ticket.priority || "Normal",
      status: "In Review",
      date: new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
      resolution: "SmartBite Care executive Priya Sharma has been assigned to your ticket. We are reviewing your details."
    };

    const tickets = getStored("smartbite_support_tickets", []);
    tickets.unshift(newTicket);
    setStored("smartbite_support_tickets", tickets);

    this.addNotification({
      title: `Support Ticket Created: #${ticketId} 🎧`,
      message: `We have logged your query regarding "${newTicket.subject}". Our care team is on it!`,
      type: "support"
    });

    return { success: true, ticket: newTicket };
  },

  async getSupportTickets(userId) {
    if (userId) {
      try {
        const res = await fetch(`${API_BASE_URL}/support-tickets/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setStored("smartbite_support_tickets", data);
            return data;
          }
        }
      } catch (e) {
        console.warn("Backend /support-tickets GET error, using local:", e.message);
      }
    }
    const tickets = getStored("smartbite_support_tickets", []);
    return userId ? tickets.filter((t) => Number(t.user_id) === Number(userId)) : tickets;
  },

  // 11. REVIEWS
  getReviews(foodId, restaurantId) {
    const all = getStored("smartbite_reviews", []);
    if (foodId) return all.filter((r) => r.food_id === foodId);
    if (restaurantId) return all.filter((r) => r.restaurant_id === restaurantId);
    return all;
  },

  submitReview(review) {
    const all = getStored("smartbite_reviews", []);
    const newRev = {
      review_id: Date.now(),
      food_id: review.food_id,
      restaurant_id: review.restaurant_id,
      user_name: review.user_name || "Foodie",
      rating: review.rating || 5,
      comment: review.comment,
      date: "Today"
    };
    all.unshift(newRev);
    setStored("smartbite_reviews", all);
    return { success: true, review: newRev };
  },

  // 12. COUPONS
  getCoupons() {
    return getStored("smartbite_coupons", []);
  },

  // 13. DIET & HEALTH PROFILE
  getDietProfile(userId) {
    return getStored(`smartbite_diet_${userId}`, {
      diet_type: "any",
      fitness_goal: "balanced",
      target_calories: 2000,
      target_protein: 70,
      allergies: "None",
      budget_preference: "medium"
    });
  },

  saveDietProfile(userId, profile) {
    setStored(`smartbite_diet_${userId}`, profile);
    return { success: true };
  },

  // 14. AI NUTRITION & FOOD ASSISTANT
  async queryNutritionAI(userQuery, currentFoodContext = null, foodsList = []) {
    const query = (userQuery || "").toLowerCase().trim();

    if (currentFoodContext && (query.includes("this") || query.includes("is it good") || query.includes("calories") || query.includes("healthy"))) {
      const isHighProtein = (currentFoodContext.protein || 0) >= 25;
      const isLowCalorie = (currentFoodContext.calories || 0) <= 350;
      return {
        text: `**${currentFoodContext.food_name}** contains **${currentFoodContext.calories || 0} kcal**, **${currentFoodContext.protein || 0}g protein**, **${currentFoodContext.carbohydrates || currentFoodContext.carbs || 0}g carbs**, and **${currentFoodContext.fat || 0}g fat**.` +
          (isHighProtein ? " 🔥 Excellent choice for muscle synthesis and gym goers!" : "") +
          (isLowCalorie ? " 🌱 Low calorie footprint, great for calorie deficit!" : " Balanced meal choice."),
        recommendedFoods: foodsList.filter((f) => f.food_id !== currentFoodContext.food_id).slice(0, 2)
      };
    }

    if (query.includes("high protein") || query.includes("protein") || query.includes("gym") || query.includes("muscle")) {
      const highProtein = foodsList
        .filter((f) => (f.protein || 0) >= 20)
        .sort((a, b) => (b.protein || 0) - (a.protein || 0))
        .slice(0, 3);
      return {
        text: highProtein.length > 0
          ? "Here are the top high-protein meals available right now:"
          : "Explore the menu for high-protein options to fuel your fitness goals.",
        recommendedFoods: highProtein
      };
    }

    if (query.includes("low calorie") || query.includes("weight loss") || query.includes("diet") || query.includes("light")) {
      const lowCal = foodsList
        .filter((f) => (f.calories || 0) <= 400 && (f.calories || 0) > 0)
        .sort((a, b) => (a.calories || 0) - (b.calories || 0))
        .slice(0, 3);
      return {
        text: lowCal.length > 0
          ? "For calorie-conscious meals, here are low-calorie options:"
          : "Discover healthy, light, calorie-conscious options from the menu.",
        recommendedFoods: lowCal
      };
    }

    if (query.includes("vegetarian") || query.includes("veg") || query.includes("paneer")) {
      const vegOptions = foodsList.filter((f) => f.is_vegetarian).slice(0, 3);
      return {
        text: vegOptions.length > 0
          ? "Here are delicious vegetarian selections:"
          : "Check out vegetarian selections on the menu.",
        recommendedFoods: vegOptions
      };
    }

    return {
      text: `SmartBite Nutrition Intelligence analyzed your request: "${userQuery}". Browse available meals with complete nutritional macros:`,
      recommendedFoods: foodsList.slice(0, 3)
    };
  }
};
