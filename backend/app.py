from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import mysql.connector
import os

app = Flask(__name__)
CORS(app)

# =========================
# DATABASE CONNECTION
# =========================

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="1234",
        database="smartbite"
    )


# =========================
# TEST DATABASE
# =========================

@app.route("/test-db")
def test_db():
    try:
        db = get_db_connection()
        db.close()

        return jsonify({
            "status": "success",
            "database": "smartbite"
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
        data = request.get_json()

        name = data.get("name")
        email = data.get("email")
        phone = data.get("phone")
        password = data.get("password")

        if not name or not email or not password:
            return jsonify({
                "status": "error",
                "message": "Name, email and password are required"
            }), 400

        db = get_db_connection()
        cursor = db.cursor()

        # Check if email already exists
        cursor.execute(
            "SELECT user_id FROM users WHERE email = %s",
            (email,)
        )

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
            "user_id": user_id
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
        data = request.get_json()

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
# IMAGE FOLDER
# =========================

IMAGE_FOLDER = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "image"
)


# =========================
# SERVE IMAGES
# =========================

@app.route("/images/<path:filename>")
def serve_image(filename):

    print("Requested image:", filename)

    return send_from_directory(
        IMAGE_FOLDER,
        filename
    )


# =========================
# HOME
# =========================

@app.route("/")
def home():

    return jsonify({
        "message": "SmartBite Backend is running",
        "image_folder": IMAGE_FOLDER
    })


# =========================
# RUN SERVER
# =========================
# =========================
# CREATE ORDER
# =========================

@app.route("/orders", methods=["POST"])
def create_order():

    try:
        data = request.get_json()

        user_id = data.get("user_id")
        restaurant_id = data.get("restaurant_id")
        total_amount = data.get("total_amount")
        items = data.get("items")

        if not user_id or not items:
            return jsonify({
                "status": "error",
                "message": "User and order items are required"
            }), 400

        db = get_db_connection()
        cursor = db.cursor()

        # Create order
        cursor.execute(
            """
            INSERT INTO orders
            (user_id, restaurant_id, total_amount, order_status)
            VALUES (%s, %s, %s, %s)
            """,
            (
                user_id,
                restaurant_id,
                total_amount,
                "Pending"
            )
        )

        order_id = cursor.lastrowid

        # Add order items
        for item in items:

            cursor.execute(
                """
                INSERT INTO order_items
                (order_id, food_id, quantity, price)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    order_id,
                    item["food_id"],
                    item.get("quantity", 1),
                    item["price"]
                )
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

        if "db" in locals():
            db.rollback()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    # =========================
# ADD FAVORITE
# =========================

@app.route("/favorites", methods=["POST"])
def add_favorite():

    try:
        data = request.get_json()

        user_id = data.get("user_id")
        food_id = data.get("food_id")
        restaurant_id = data.get("restaurant_id")

        if not user_id or not food_id:
            return jsonify({
                "status": "error",
                "message": "User ID and food ID are required"
            }), 400

        db = get_db_connection()
        cursor = db.cursor()

        # Check if already favorite
        cursor.execute(
            """
            SELECT favorite_id
            FROM favorites
            WHERE user_id = %s AND food_id = %s
            """,
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
            INSERT INTO favorites
            (user_id, food_id, restaurant_id)
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


# =========================
# GET USER FAVORITES
# =========================

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
            JOIN food_items fi
                ON f.food_id = fi.food_id
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

        # =========================
# REMOVE FAVORITE
# =========================

@app.route("/favorites/<int:user_id>/<int:food_id>", methods=["DELETE"])
def remove_favorite(user_id, food_id):

    try:
        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute(
            """
            DELETE FROM favorites
            WHERE user_id = %s AND food_id = %s
            """,
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
    # =========================
# GET USER ORDERS
# =========================

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
    LEFT JOIN order_items oi
        ON o.order_id = oi.order_id
    LEFT JOIN food_items f
        ON oi.food_id = f.food_id
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

        print("Get orders error:", e)

        return jsonify({
            "message": str(e)
        }), 500


# =========================
# TABLE BOOKINGS
# =========================

def ensure_booking_and_support_tables(db):
    cursor = db.cursor()
    cursor.execute("""
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS support_tickets (
            ticket_id VARCHAR(50) PRIMARY KEY,
            user_id INT NOT NULL,
            order_id INT,
            category VARCHAR(100) NOT NULL,
            subject VARCHAR(200) NOT NULL,
            description TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'In Review',
            resolution TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db.commit()
    cursor.close()


@app.route("/table-bookings", methods=["POST"])
def create_table_booking():
    try:
        data = request.get_json()
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

        import random
        booking_id = f"SB-HYD-{random.randint(1000, 9999)}"

        db = get_db_connection()
        ensure_booking_and_support_tables(db)
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
        ensure_booking_and_support_tables(db)
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
        data = request.get_json()
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

        import random
        ticket_id = f"TKT-{random.randint(10000, 99999)}"
        resolution = "SmartBite Care has received your ticket. An executive is actively handling your request."

        db = get_db_connection()
        ensure_booking_and_support_tables(db)
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
        ensure_booking_and_support_tables(db)
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
    print("SmartBite Backend")
    print("-----------------------------------")
    print("Image folder:", IMAGE_FOLDER)
    print("Server: http://127.0.0.1:5000")
    print("-----------------------------------")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )