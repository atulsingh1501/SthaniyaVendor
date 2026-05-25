"""
Seed script  populates PostgreSQL with sample stores and products.
Run once: python seed_db.py
"""
import psycopg2
import psycopg2.extras
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/vendorlink")


def hash_password(p: str) -> str:
    return hashlib.sha256(p.encode()).hexdigest()


def seed():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    print(" Seeding database...")

    # Create a demo vendor account
    cur.execute(
        """INSERT INTO users (phone, password_hash)
           VALUES (%s, %s)
           ON CONFLICT (phone) DO NOTHING
           RETURNING id""",
        ("9999999999", hash_password("testpassword123"))
    )
    row = cur.fetchone()
    if row:
        vendor_id = row["id"]
        print(f"  Created demo vendor: 9999999999 (id={vendor_id})")
    else:
        cur.execute("SELECT id FROM users WHERE phone = '9999999999'")
        vendor_id = cur.fetchone()["id"]
        print(f"  Demo vendor already exists (id={vendor_id})")

    # Sample stores with Vadodara coordinates
    stores = [
        {
            "name": "Reliance Fresh",
            "category": "Grocery",
            "phone": "+919876543210",
            "location_text": "Alkapuri, Vadodara",
            "latitude": 22.3060,
            "longitude": 73.1700,
            "rating": 4.2,
        },
        {
            "name": "Apollo Pharmacy",
            "category": "Pharmacy",
            "phone": "+919876543211",
            "location_text": "Akota, Vadodara",
            "latitude": 22.3100,
            "longitude": 73.1650,
            "rating": 4.8,
        },
        {
            "name": "Pantaloons Clothing",
            "category": "Clothing",
            "phone": "+919876543212",
            "location_text": "Sayajigunj, Vadodara",
            "latitude": 22.3125,
            "longitude": 73.1850,
            "rating": 4.0,
        },
        {
            "name": "Croma Electronics",
            "category": "Electronics",
            "phone": "+919876543213",
            "location_text": "Fatehgunj, Vadodara",
            "latitude": 22.3200,
            "longitude": 73.1900,
            "rating": 4.5,
        },
        {
            "name": "Sharma Grocery",
            "category": "Grocery",
            "phone": "+919876543214",
            "location_text": "Manjalpur, Vadodara",
            "latitude": 22.2900,
            "longitude": 73.1750,
            "rating": 4.3,
        },
        {
            "name": "City Bakery",
            "category": "Bakery",
            "phone": "+919876543215",
            "location_text": "Productivity Circle, Vadodara",
            "latitude": 22.3070,
            "longitude": 73.1810,
            "rating": 4.6,
        },
    ]

    # Sample products per store category
    products_by_category = {
        "Grocery": [
            ("Tata Salt 1kg", 22.0, "pack"),
            ("Amul Butter 500g", 270.0, "pack"),
            ("Aashirvaad Atta 5kg", 220.0, "pack"),
            ("Fortune Oil 1L", 130.0, "L"),
            ("Brown Eggs (12pcs)", 84.0, "dozen"),
        ],
        "Pharmacy": [
            ("Dolo 650 Strip", 32.0, "piece"),
            ("Cetrizine 10mg", 18.0, "piece"),
            ("Volini Spray", 215.0, "piece"),
            ("Insulin Syringe (Box)", 120.0, "pack"),
            ("BP Monitor", 1299.0, "piece"),
        ],
        "Clothing": [
            ("Men's T-Shirt (XL)", 599.0, "piece"),
            ("Women's Kurti", 799.0, "piece"),
            ("Denim Jeans", 1299.0, "piece"),
            ("Kids Shorts", 299.0, "piece"),
            ("Sports Socks (3 pair)", 199.0, "pack"),
        ],
        "Electronics": [
            ("Samsung 43\" Smart TV", 32000.0, "piece"),
            ("Boat Smartwatch", 1599.0, "piece"),
            ("JBL Bluetooth Earbuds", 2100.0, "piece"),
            ("Playstation 5", 49999.0, "piece"),
            ("USB-C Fast Charger", 499.0, "piece"),
        ],
        "Bakery": [
            ("Whole Wheat Bread", 45.0, "piece"),
            ("Chocolate Croissant", 60.0, "piece"),
            ("Birthday Cake (1kg)", 650.0, "kg"),
            ("Muffin Pack (6)", 120.0, "pack"),
            ("Garlic Bread", 80.0, "piece"),
        ],
    }

    for s in stores:
        # Insert store (skip if name already exists)
        cur.execute(
            """INSERT INTO stores (vendor_id, name, category, phone, location_text, latitude, longitude, rating)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT DO NOTHING
               RETURNING id""",
            (vendor_id, s["name"], s["category"], s["phone"],
             s["location_text"], s["latitude"], s["longitude"], s["rating"])
        )
        row = cur.fetchone()
        if not row:
            print(f"  Store '{s['name']}' already exists, skipping.")
            continue

        store_id = row["id"]
        print(f"   Store: {s['name']} (id={store_id})")

        # Insert products
        prods = products_by_category.get(s["category"], [])
        for pname, pprice, punit in prods:
            cur.execute(
                """INSERT INTO products (store_id, name, price, unit, is_in_stock)
                   VALUES (%s, %s, %s, %s, TRUE)""",
                (store_id, pname, pprice, punit)
            )
        print(f"     Added {len(prods)} products")

    print("\n Seeding complete!")
    print("   Demo vendor login: phone=9999999999, password=testpassword123")
    cur.close()
    conn.close()


if __name__ == "__main__":
    seed()

