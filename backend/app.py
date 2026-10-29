from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import sqlite3
import os
import random

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGE_FOLDER = os.path.join(BASE_DIR, "image")
DB_PATH = os.path.join(BASE_DIR, "smartbite.db")

# =========================
# SQLITE COMPATIBILITY WRAPPER
# =========================

class SQLiteCursorWrapper:
    def __init__(self, cursor, dictionary=False):
        self._cursor = cursor
        self.dictionary = dictionary
        self.lastrowid = None

    def execute(self, query, params=None):
        q = query.replace("%s", "?")
        if params is not None:
            self._cursor.execute(q, params)
        else:
            self._cursor.execute(q)
        self.lastrowid = self._cursor.lastrowid
        return self

    def fetchall(self):
        rows = self._cursor.fetchall()
        if self.dictionary and self._cursor.description:
            cols = [col[0] for col in self._cursor.description]
            return [dict(zip(cols, row)) for row in rows]
        return rows

    def fetchone(self):
        row = self._cursor.fetchone()
        if row is None:
            return None
        if self.dictionary and self._cursor.description:
            cols = [col[0] for col in self._cursor.description]
            return dict(zip(cols, row))
        return row

    def close(self):
        self._cursor.close()


class SQLiteConnectionWrapper:
    def __init__(self, db_path):
        self._conn = sqlite3.connect(db_path, check_same_thread=False)

    def cursor(self, dictionary=False):
        return SQLiteCursorWrapper(self._conn.cursor(), dictionary=dictionary)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()


def get_db_connection():
    return SQLiteConnectionWrapper(DB_PATH)


def init_sqlite_database():
    """Initializes tables and seed data if not existing."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS restaurants (
            restaurant_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            address TEXT,
            city TEXT DEFAULT 'Hyderabad',
            phone TEXT,
            email TEXT,
            rating REAL DEFAULT 4.5,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
            category_id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_name TEXT NOT NULL UNIQUE,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS food_items (
            food_id INTEGER PRIMARY KEY AUTOINCREMENT,
            restaurant_id INTEGER NOT NULL,
            category_id INTEGER,
            food_name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            calories INTEGER DEFAULT 0,
            protein REAL DEFAULT 0.0,
            carbohydrates REAL DEFAULT 0.0,
            fat REAL DEFAULT 0.0,
            fiber REAL DEFAULT 0.0,
            health_rating INTEGER DEFAULT 85,
            is_vegetarian INTEGER DEFAULT 0,
            image_url TEXT,
            is_available INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders (
            order_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            restaurant_id INTEGER,
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_amount REAL NOT NULL,
            order_status TEXT DEFAULT 'Pending',
            delivery_address TEXT,
            payment_method TEXT DEFAULT 'UPI'
        );

        CREATE TABLE IF NOT EXISTS order_items (
            order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            food_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 1,
            price REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS favorites (
            favorite_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            food_id INTEGER NOT NULL,
            restaurant_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (user_id, food_id)
        );

        CREATE TABLE IF NOT EXISTS table_bookings (
            booking_id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            restaurant_id INTEGER NOT NULL,
            restaurant_name TEXT,
            guest_name TEXT NOT NULL,
            guest_phone TEXT NOT NULL,
            guests_count INTEGER NOT NULL DEFAULT 2,
            booking_date TEXT NOT NULL,
            booking_time TEXT NOT NULL,
            seating_area TEXT DEFAULT 'Indoor AC',
            occasion TEXT DEFAULT 'Casual Dining',
            special_requests TEXT,
            booking_status TEXT DEFAULT 'Confirmed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS support_tickets (
            ticket_id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            order_id INTEGER,
            category TEXT NOT NULL,
            subject TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'In Review',
            resolution TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()

    # Seed restaurants if empty
    cursor.execute("SELECT COUNT(*) FROM restaurants")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
            INSERT INTO restaurants (restaurant_id, name, description, address, city, phone, email, rating, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            (1, "SmartBite Kitchen", "Healthy and delicious meals", "Road No 36, Jubilee Hills", "Hyderabad", "+91 98765 00001", "info@smartbitekitchen.com", 4.5, 1),
            (2, "Green Bowl Cafe", "Healthy salads, bowls and nutritious meals", "Banjara Hills Road 12", "Hyderabad", "+91 98765 00002", "hello@greenbowl.in", 4.4, 1),
            (3, "Spice Garden", "Authentic Indian food with delicious flavors", "Cyber Towers, Hitec City", "Hyderabad", "+91 98765 00003", "contact@spicegarden.com", 4.6, 1),
            (4, "Urban Bites", "Gourmet wraps, bowls and fresh juices", "Inorbit Mall Road, Madhapur", "Hyderabad", "+91 98765 00004", "orders@urbanbites.in", 4.5, 1)
        ])
        conn.commit()

    # Seed categories if empty
    cursor.execute("SELECT COUNT(*) FROM categories")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
            INSERT INTO categories (category_id, category_name, description)
            VALUES (?, ?, ?)
        """, [
            (1, "Healthy Bowls", "Nutrient-packed macro bowls"),
            (2, "Biryani", "Authentic Hyderabadi specialities"),
            (3, "South Indian", "Crisp dosas and wholesome traditional tiffins"),
            (4, "Sandwiches & Wraps", "High-protein artisanal sourdough sandwiches")
        ])
        conn.commit()

    # Seed foods if empty
    cursor.execute("SELECT COUNT(*) FROM food_items")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
            INSERT INTO food_items (food_id, restaurant_id, category_id, food_name, description, price, calories, protein, carbohydrates, fat, fiber, health_rating, is_vegetarian, image_url, is_available)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            (1, 1, 2, "Chicken Biryani", "Fragrant Basmati rice cooked with tender spiced chicken and saffron", 199.00, 580, 28.0, 62.0, 16.0, 4.0, 85, 0, "chicken-biryani.jpg", 1),
            (2, 3, 3, "Masala Dosa", "Crispy golden fermented crepe stuffed with spiced potato masala", 129.00, 320, 8.0, 48.0, 9.0, 5.0, 90, 1, "masala-dosa.jpg", 1),
            (3, 2, 1, "Grilled Chicken Bowl", "Marinated grilled breast with brown rice, edamame and lemon vinaigrette", 249.00, 380, 42.0, 28.0, 8.0, 6.0, 95, 0, "grilled-chicken-bowl.jpg", 1),
            (4, 2, 1, "Veggie Power Bowl", "Avocado, roasted chickpeas, purple cabbage, quinoa and tahini", 199.00, 310, 14.0, 38.0, 10.0, 9.0, 96, 1, "veggie-power-bowl.jpg", 1),
            (5, 3, 1, "Paneer Tikka Bowl", "Tandoori cottage cheese cubes served over turmeric rice and garden greens", 229.00, 410, 22.0, 34.0, 14.0, 7.0, 88, 1, "paneer-tikka-bowl.jpg", 1),
            (6, 4, 4, "Chicken Sandwich", "Herb-roasted pulled chicken breast on whole wheat sourdough", 169.00, 350, 24.0, 36.0, 9.0, 5.0, 89, 0, "chicken-sandwich.jpg", 1),
            (7, 1, 1, "Fruit & Yogurt Bowl", "Greek yogurt with seasonal berries, chia seeds and organic honey", 149.00, 210, 9.0, 32.0, 3.0, 5.0, 94, 1, "fruit-yogurt-bowl.jpg", 1)
        ])
        conn.commit()

    conn.close()

# Initialize SQLite database immediately
init_sqlite_database()


def ensure_booking_and_support_tables(db):
    """Safety check for table bookings and support tickets."""
    init_sqlite_database()


# =========================
# TEST DATABASE
# =========================

@app.route("/test-db")
def test_db():
    try:
        db = get_db_connection()
        cursor = db.cursor()
        cursor.execute("SELECT COUNT(*) FROM restaurants")
        count = cursor.fetchone()[0]
        cursor.close()
        db.close()

        return jsonify({
            "status": "success",
            "database": "sqlite",
            "restaurants_count": count
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# =========================
# REGISTER
# =========================

@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json() or {}

        name = data.get("name")
        email = data.get("email")
        phone = data.get("phone", "")
        password = data.get("password")

        if not name or not email or not password:
            return jsonify({
                "status": "error",
                "message": "Name, email and password are required"
            }), 400

        db = get_db_connection()
        cursor = db.cursor()

        # Check if email already exists
        cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            cursor.close()
            db.close()
            return jsonify({
                "status": "error",
                "message": "Email already registered"
            }), 409

        # Insert new user
        cursor.execute(
            """
            INSERT INTO users (name, email, phone, password)
            VALUES (%s, %s, %s, %s)
            """,
            (name, email, phone, password)
        )
        db.commit()
        user_id = cursor.lastrowid
        cursor.close()
        db.close()

        return jsonify({
            "status": "success",
            "message": "Registration successful",
            "user_id": user_id,
            "user": {
                "user_id": user_id,
                "name": name,
                "email": email,
                "phone": phone
            }
        }), 201

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# =========================
# LOGIN
# =========================

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json() or {}

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({
                "status": "error",
                "message": "Email and password are required"
            }), 400

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT user_id, name, email, phone
            FROM users
            WHERE email = %s AND password = %s
            """,
            (email, password)
        )
        user = cursor.fetchone()
        cursor.close()
        db.close()

        if not user:
            return jsonify({
                "status": "error",
                "message": "Invalid email or password"
            }), 401

        return jsonify({
            "status": "success",
            "message": "Login successful",
            "user": user
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# =========================
# RESTAURANTS
# =========================

@app.route("/restaurants", methods=["GET"])
def get_restaurants():
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                restaurant_id,
                name,
                description,
                address,
                city,
                phone,
                email,
                rating,
                is_active
            FROM restaurants
            WHERE is_active = 1
        """)
        restaurants = cursor.fetchall()
        cursor.close()
        db.close()

        return jsonify(restaurants)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# =========================
# FOODS
# =========================

@app.route("/foods", methods=["GET"])
def get_foods():
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                food_id,
                restaurant_id,
                category_id,
                food_name,
                description,
                price,
                calories,
                protein,
                carbohydrates,
                fat,
                fiber,
                health_rating,
                is_vegetarian,
                image_url
            FROM food_items
            WHERE is_available = 1
        """)
        foods = cursor.fetchall()
        cursor.close()
        db.close()

        return jsonify(foods)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# =========================
# SERVE IMAGES
# =========================

@app.route("/images/<path:filename>")
def serve_image(filename):
    return send_from_directory(IMAGE_FOLDER, filename)


# =========================
# HOME
# =========================

@app.route("/")
def home():
    return jsonify({
        "message": "SmartBite Backend running with SQLite",
        "database": DB_PATH,
        "image_folder": IMAGE_FOLDER
    })


# =========================
# CREATE ORDER
# =========================

@app.route("/orders", methods=["POST"])
def create_order():
    try:
        data = request.get_json() or {}

        user_id = data.get("user_id")
        restaurant_id = data.get("restaurant_id", 1)
        total_amount = data.get("total_amount", 0)
        items = data.get("items", [])
        delivery_address = data.get("delivery_address", "Hyderabad")
        payment_method = data.get("payment_method", "UPI")

        if not user_id or not items:
            return jsonify({
                "status": "error",
                "message": "User and order items are required"
            }), 400

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute(
            """
            INSERT INTO orders
            (user_id, restaurant_id, total_amount, order_status, delivery_address, payment_method)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (user_id, restaurant_id, total_amount, "Pending", delivery_address, payment_method)
        )
        order_id = cursor.lastrowid

        for item in items:
            cursor.execute(
                """
                INSERT INTO order_items
                (order_id, food_id, quantity, price)
                VALUES (%s, %s, %s, %s)
                """,
                (order_id, item.get("food_id"), item.get("quantity", 1), item.get("price", 0))
            )

        db.commit()
        cursor.close()
        db.close()

        return jsonify({
            "status": "success",
            "message": "Order placed successfully",
            "order_id": order_id
        }), 201

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# =========================
# FAVORITES
# =========================

@app.route("/favorites", methods=["POST"])
def add_favorite():
    try:
        data = request.get_json() or {}

        user_id = data.get("user_id")
        food_id = data.get("food_id")
        restaurant_id = data.get("restaurant_id", 1)

        if not user_id or not food_id:
            return jsonify({
                "status": "error",
                "message": "User ID and food ID are required"
            }), 400

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute(
            "SELECT favorite_id FROM favorites WHERE user_id = %s AND food_id = %s",
            (user_id, food_id)
        )
        existing = cursor.fetchone()

        if existing:
            cursor.close()
            db.close()
            return jsonify({
                "status": "error",
                "message": "Already added to favorites"
            }), 409

        cursor.execute(
            """
            INSERT INTO favorites (user_id, food_id, restaurant_id)
            VALUES (%s, %s, %s)
            """,
            (user_id, food_id, restaurant_id)
        )
        db.commit()
        favorite_id = cursor.lastrowid
        cursor.close()
        db.close()

        return jsonify({
            "status": "success",
            "message": "Added to favorites",
            "favorite_id": favorite_id
        }), 201

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/favorites/<int:user_id>", methods=["GET"])
def get_favorites(user_id):
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                f.favorite_id,
                f.food_id,
                f.restaurant_id,
                fi.food_name,
                fi.price,
                fi.image_url
            FROM favorites f
            JOIN food_items fi ON f.food_id = fi.food_id
            WHERE f.user_id = %s
            ORDER BY f.created_at DESC
            """,
            (user_id,)
        )
        favorites = cursor.fetchall()
        cursor.close()
        db.close()

        return jsonify(favorites)

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/favorites/<int:user_id>/<int:food_id>", methods=["DELETE"])
def remove_favorite(user_id, food_id):
    try:
        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute(
            "DELETE FROM favorites WHERE user_id = %s AND food_id = %s",
            (user_id, food_id)
        )
        db.commit()
        cursor.close()
        db.close()

        return jsonify({
            "status": "success",
            "message": "Removed from favorites"
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/orders/<int:user_id>", methods=["GET"])
def get_user_orders(user_id):
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                o.order_id,
                o.user_id,
                o.restaurant_id,
                o.order_date,
                o.total_amount,
                o.order_status,
                oi.order_item_id,
                oi.food_id,
                oi.quantity,
                oi.price,
                f.food_name
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN food_items f ON oi.food_id = f.food_id
            WHERE o.user_id = %s
            ORDER BY o.order_date DESC
            """,
            (user_id,)
        )
        orders = cursor.fetchall()
        cursor.close()
        db.close()

        return jsonify(orders), 200

    except Exception as e:
        return jsonify({
            "message": str(e)
        }), 500


# =========================
# TABLE BOOKINGS
# =========================

@app.route("/table-bookings", methods=["POST"])
def create_table_booking():
    try:
        data = request.get_json() or {}
        user_id = data.get("user_id", 1)
        restaurant_id = data.get("restaurant_id", 1)
        restaurant_name = data.get("restaurant_name", "SmartBite Dining")
        guest_name = data.get("guest_name")
        guest_phone = data.get("guest_phone")
        guests_count = data.get("guests_count", 2)
        booking_date = data.get("booking_date")
        booking_time = data.get("booking_time", "07:30 PM")
        seating_area = data.get("seating_area", "Indoor AC")
        occasion = data.get("occasion", "Casual Dining")
        special_requests = data.get("special_requests", "None")

        if not guest_name or not guest_phone or not booking_date:
            return jsonify({
                "status": "error",
                "message": "Guest name, phone, and booking date are required"
            }), 400

        booking_id = f"TB-{random.randint(1000, 9999)}"

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            INSERT INTO table_bookings
            (booking_id, user_id, restaurant_id, restaurant_name, guest_name, guest_phone, guests_count, booking_date, booking_time, seating_area, occasion, special_requests, booking_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Confirmed')
        """, (booking_id, user_id, restaurant_id, restaurant_name, guest_name, guest_phone, guests_count, booking_date, booking_time, seating_area, occasion, special_requests))

        db.commit()
        cursor.close()
        db.close()

        booking_obj = {
            "booking_id": booking_id,
            "user_id": user_id,
            "restaurant_id": restaurant_id,
            "restaurant_name": restaurant_name,
            "guest_name": guest_name,
            "guest_phone": guest_phone,
            "guests_count": guests_count,
            "booking_date": str(booking_date),
            "booking_time": booking_time,
            "seating_area": seating_area,
            "occasion": occasion,
            "special_requests": special_requests,
            "status": "Confirmed"
        }

        return jsonify({
            "status": "success",
            "message": "Table reserved successfully",
            "booking": booking_obj
        }), 201

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/table-bookings/<int:user_id>", methods=["GET"])
def get_user_table_bookings(user_id):
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                booking_id,
                user_id,
                restaurant_id,
                restaurant_name,
                guest_name,
                guest_phone,
                guests_count,
                booking_date,
                booking_time,
                seating_area,
                occasion,
                special_requests,
                booking_status AS status,
                created_at
            FROM table_bookings
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))

        bookings = cursor.fetchall()
        for b in bookings:
            if b.get("booking_date"):
                b["booking_date"] = str(b["booking_date"])
            if b.get("created_at"):
                b["created_at"] = str(b["created_at"])

        cursor.close()
        db.close()

        return jsonify(bookings), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# =========================
# CUSTOMER SUPPORT TICKETS
# =========================

@app.route("/support-tickets", methods=["POST"])
def create_support_ticket():
    try:
        data = request.get_json() or {}
        user_id = data.get("user_id", 1)
        order_id = data.get("order_id")
        category = data.get("category", "General Inquiry")
        subject = data.get("subject", "").strip()
        description = data.get("description", "").strip()

        if not subject or not description:
            return jsonify({
                "status": "error",
                "message": "Subject and description are required"
            }), 400

        ticket_id = f"TKT-{random.randint(10000, 99999)}"
        resolution = "SmartBite Care has received your ticket. An executive is actively handling your request."

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            INSERT INTO support_tickets
            (ticket_id, user_id, order_id, category, subject, description, status, resolution)
            VALUES (%s, %s, %s, %s, %s, %s, 'In Review', %s)
        """, (ticket_id, user_id, order_id if order_id else None, category, subject, description, resolution))

        db.commit()
        cursor.close()
        db.close()

        ticket_obj = {
            "ticket_id": ticket_id,
            "user_id": user_id,
            "order_id": order_id,
            "category": category,
            "subject": subject,
            "description": description,
            "status": "In Review",
            "resolution": resolution,
            "date": "Today"
        }

        return jsonify({
            "status": "success",
            "message": "Support ticket created successfully",
            "ticket": ticket_obj
        }), 201

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/support-tickets/<int:user_id>", methods=["GET"])
def get_user_support_tickets(user_id):
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                ticket_id,
                user_id,
                order_id,
                category,
                subject,
                description,
                status,
                resolution,
                created_at AS date
            FROM support_tickets
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))

        tickets = cursor.fetchall()
        for t in tickets:
            if t.get("date"):
                t["date"] = str(t["date"])

        cursor.close()
        db.close()

        return jsonify(tickets), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == "__main__":
    print("-----------------------------------")
    print("SmartBite Backend (SQLite Mode)")
    print("-----------------------------------")
    print("Database:", DB_PATH)
    print("Image folder:", IMAGE_FOLDER)
    print("Server: http://127.0.0.1:5000")
    print("-----------------------------------")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )
