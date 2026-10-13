-- ========================================================
-- SmartBite Database Schema (DDL Only - No Dummy Data)
-- ========================================================

CREATE DATABASE IF NOT EXISTS smartbite;
USE smartbite;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Restaurants Table
CREATE TABLE IF NOT EXISTS restaurants (
    restaurant_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    address VARCHAR(255),
    city VARCHAR(100) DEFAULT 'Hyderabad',
    phone VARCHAR(20),
    email VARCHAR(150),
    rating DECIMAL(2,1) DEFAULT 4.5,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Food Categories Table
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Food Items Table
CREATE TABLE IF NOT EXISTS food_items (
    food_id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    category_id INT,
    food_name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    calories INT DEFAULT 0,
    protein DECIMAL(5,1) DEFAULT 0.0,
    carbohydrates DECIMAL(5,1) DEFAULT 0.0,
    fat DECIMAL(5,1) DEFAULT 0.0,
    fiber DECIMAL(5,1) DEFAULT 0.0,
    health_rating INT DEFAULT 85,
    is_vegetarian TINYINT(1) DEFAULT 0,
    image_url VARCHAR(255),
    is_available TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    restaurant_id INT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    order_status VARCHAR(50) DEFAULT 'Pending',
    delivery_address TEXT,
    payment_method VARCHAR(50) DEFAULT 'UPI',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE SET NULL
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    food_id INT NOT NULL,
    quantity INT DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES food_items(food_id) ON DELETE CASCADE
);

-- Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
    favorite_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    food_id INT NOT NULL,
    restaurant_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_food (user_id, food_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES food_items(food_id) ON DELETE CASCADE
);

-- Table Bookings Table
CREATE TABLE IF NOT EXISTS table_bookings (
    booking_id VARCHAR(50) PRIMARY KEY,
    user_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    restaurant_name VARCHAR(150),
    guest_name VARCHAR(100) NOT NULL,
    guest_phone VARCHAR(20) NOT NULL,
    guests_count INT NOT NULL DEFAULT 2,
    booking_date DATE NOT NULL,
    booking_time VARCHAR(20) NOT NULL,
    seating_area VARCHAR(50) DEFAULT 'Indoor AC',
    occasion VARCHAR(50) DEFAULT 'Casual Dining',
    special_requests TEXT,
    booking_status VARCHAR(50) DEFAULT 'Confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE
);

-- Customer Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id VARCHAR(50) PRIMARY KEY,
    user_id INT NOT NULL,
    order_id INT,
    category VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'In Review',
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);
