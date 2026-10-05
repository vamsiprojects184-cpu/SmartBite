const API_BASE_URL = "http://127.0.0.1:5000";

export async function getRestaurants() {
  const response = await fetch(`${API_BASE_URL}/restaurants`);

  if (!response.ok) {
    throw new Error("Failed to load restaurants");
  }

  return response.json();
}

export async function getFoods() {
  const response = await fetch(`${API_BASE_URL}/foods`);

  if (!response.ok) {
    throw new Error("Failed to load foods");
  }

  return response.json();
}

export async function getCategories() {
  const response = await fetch(`${API_BASE_URL}/categories`);

  if (!response.ok) {
    throw new Error("Failed to load categories");
  }

  return response.json();
}

export async function getNutrition(foodId) {
  const response = await fetch(`${API_BASE_URL}/nutrition/${foodId}`);

  if (!response.ok) {
    throw new Error("Nutrition information not found");
  }

  return response.json();
}

export async function searchFoods(query) {
  const response = await fetch(
    `${API_BASE_URL}/foods/search?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("Food search failed");
  }

  return response.json();
}

export async function searchRestaurants(query) {
  const response = await fetch(
    `${API_BASE_URL}/restaurants/search?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("Restaurant search failed");
  }

  return response.json();
}

export async function analyzeNutrition(nutritionData) {
  const response = await fetch(`${API_BASE_URL}/nutrition/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(nutritionData),
  });

  if (!response.ok) {
    throw new Error("Nutrition analysis failed");
  }

  return response.json();
}