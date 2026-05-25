from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, List
import hashlib
import jwt
import time
import uuid
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()  # Load .env file automatically

import psycopg2
import psycopg2.extras
from psycopg2.pool import SimpleConnectionPool

# ─── Config ───────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET", "vendor-link-super-secret-key-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_SECONDS = 60 * 60 * 24 * 7  # 7 days

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/vendorlink"
)

# ─── Connection Pool ──────────────────────────────────────────────────────────
pool: Optional[SimpleConnectionPool] = None


def get_pool():
    global pool
    if pool is None:
        pool = SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=DATABASE_URL,
        )
    return pool


def get_db():
    conn = get_pool().getconn()
    conn.autocommit = False
    try:
        yield conn
    except Exception:
        conn.rollback()
        raise
    finally:
        get_pool().putconn(conn)


# ─── App ──────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    init_db()
    yield
    # shutdown
    if pool:
        pool.closeall()


app = FastAPI(
    title="Vendor Link API",
    version="2.0.0",
    description="FastAPI + PostgreSQL backend for SthaniyaVendor hyperlocal marketplace",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)


# ─── Database Init ────────────────────────────────────────────────────────────
def init_db():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            phone       TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at  TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS stores (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            vendor_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name          TEXT NOT NULL,
            category      TEXT,
            phone         TEXT,
            location_text TEXT,
            latitude      DOUBLE PRECISION,
            longitude     DOUBLE PRECISION,
            rating        DOUBLE PRECISION DEFAULT 4.5,
            upi_id        TEXT,
            created_at    TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS products (
            id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            store_id     UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
            name         TEXT NOT NULL,
            price        DOUBLE PRECISION DEFAULT 0,
            unit         TEXT DEFAULT 'piece',
            category     TEXT DEFAULT 'Item',
            is_in_stock  BOOLEAN DEFAULT TRUE,
            created_at   TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_stores_vendor ON stores(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
        CREATE INDEX IF NOT EXISTS idx_stores_location ON stores(latitude, longitude);
    """)
    try:
        cur.execute("ALTER TABLE stores ADD COLUMN IF NOT EXISTS upi_id TEXT;")
    except Exception as e:
        print(f"Skipping alter: {e}")
    cur.close()
    conn.close()
    print("[OK] Database initialized")


# ─── Auth helpers ─────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_token(user_id: str) -> str:
    payload = {
        "sub": str(user_id),
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_EXPIRE_SECONDS,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db=Depends(get_db),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, phone FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    cur.close()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return dict(user)


# ─── Schemas ──────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    phone: str
    password: str = "testpassword123"


class LoginRequest(BaseModel):
    phone: str
    password: str = "testpassword123"


class StoreCreate(BaseModel):
    name: str
    category: Optional[str] = None
    phone: Optional[str] = None
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    upi_id: Optional[str] = None


class StoreUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    phone: Optional[str] = None
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rating: Optional[float] = None
    upi_id: Optional[str] = None


class ProductCreate(BaseModel):
    name: str
    price: float = 0.0
    unit: str = "piece"
    category: Optional[str] = "Item"
    is_in_stock: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    is_in_stock: Optional[bool] = None


# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health(db=Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT version()")
    version = cur.fetchone()[0]
    cur.close()
    return {"status": "ok", "service": "Vendor Link API v2", "db": version}


# ─── Auth Endpoints ───────────────────────────────────────────────────────────
@app.post("/auth/register", tags=["Auth"])
def register(body: RegisterRequest, db=Depends(get_db)):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Check if phone already registered
    cur.execute("SELECT id, password_hash FROM users WHERE phone = %s", (body.phone,))
    existing = cur.fetchone()

    if existing:
        # Auto-login if password matches (idempotent register)
        if existing["password_hash"] != hash_password(body.password):
            raise HTTPException(
                status_code=400,
                detail="Phone already registered with different password"
            )
        token = create_token(str(existing["id"]))
        cur.close()
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {"id": str(existing["id"]), "phone": body.phone}
        }

    # Create new user
    cur.execute(
        "INSERT INTO users (phone, password_hash) VALUES (%s, %s) RETURNING id",
        (body.phone, hash_password(body.password))
    )
    user_id = cur.fetchone()["id"]
    db.commit()
    token = create_token(str(user_id))
    cur.close()
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": str(user_id), "phone": body.phone}
    }


@app.post("/auth/login", tags=["Auth"])
def login(body: LoginRequest, db=Depends(get_db)):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, phone, password_hash FROM users WHERE phone = %s", (body.phone,))
    user = cur.fetchone()
    cur.close()

    if not user or user["password_hash"] != hash_password(body.password):
        raise HTTPException(status_code=401, detail="Invalid phone or password")

    token = create_token(str(user["id"]))
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": str(user["id"]), "phone": user["phone"]}
    }


@app.get("/auth/me", tags=["Auth"])
def get_me(current_user=Depends(get_current_user)):
    return {"id": str(current_user["id"]), "phone": current_user["phone"]}


# ─── Stores Endpoints ─────────────────────────────────────────────────────────
@app.get("/stores", tags=["Stores"])
def list_stores(
    lat: Optional[float] = Query(None, description="User latitude for distance sorting"),
    lng: Optional[float] = Query(None, description="User longitude for distance sorting"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by store name"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db=Depends(get_db),
):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Build dynamic query
    conditions = []
    params = []

    if category:
        conditions.append("s.category ILIKE %s")
        params.append(f"%{category}%")

    if search:
        conditions.append("s.name ILIKE %s")
        params.append(f"%{search}%")

    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

    # Distance ordering if lat/lng provided
    if lat is not None and lng is not None:
        distance_col = f"""
            (6371 * acos(
                cos(radians({lat})) * cos(radians(s.latitude)) *
                cos(radians(s.longitude) - radians({lng})) +
                sin(radians({lat})) * sin(radians(s.latitude))
            )) AS distance_km
        """
        order_by = "ORDER BY distance_km ASC"
    else:
        distance_col = "NULL AS distance_km"
        order_by = "ORDER BY s.created_at DESC"

    query = f"""
        SELECT s.*,
               {distance_col},
               COUNT(p.id) AS products_count,
               COUNT(p.id) FILTER (WHERE p.is_in_stock = TRUE) AS in_stock_count
        FROM stores s
        LEFT JOIN products p ON p.store_id = s.id
        {where_clause}
        GROUP BY s.id
        {order_by}
        LIMIT %s OFFSET %s
    """
    params += [limit, offset]
    cur.execute(query, params)
    stores = cur.fetchall()

    # Total count
    cur.execute(
        f"SELECT COUNT(*) FROM stores s {where_clause}",
        params[:-2] if params[:-2] else []
    )
    total = cur.fetchone()["count"]
    cur.close()

    return {
        "total": total,
        "stores": [dict(s) for s in stores]
    }


@app.get("/stores/vendor/me", tags=["Stores"])
def get_my_store(current_user=Depends(get_current_user), db=Depends(get_db)):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM stores WHERE vendor_id = %s", (current_user["id"],))
    store = cur.fetchone()
    if not store:
        cur.close()
        return None
    store = dict(store)

    cur.execute(
        "SELECT * FROM products WHERE store_id = %s ORDER BY created_at DESC",
        (store["id"],)
    )
    store["products"] = [dict(p) for p in cur.fetchall()]
    cur.close()
    return store


@app.get("/stores/{store_id}", tags=["Stores"])
def get_store(store_id: str, db=Depends(get_db)):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM stores WHERE id = %s", (store_id,))
    store = cur.fetchone()
    if not store:
        cur.close()
        raise HTTPException(status_code=404, detail="Store not found")

    store = dict(store)
    cur.execute(
        "SELECT * FROM products WHERE store_id = %s ORDER BY name ASC",
        (store["id"],)
    )
    store["products"] = [dict(p) for p in cur.fetchall()]
    cur.close()
    return store


@app.post("/stores", status_code=status.HTTP_201_CREATED, tags=["Stores"])
def create_store(
    body: StoreCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # One store per vendor
    cur.execute("SELECT id FROM stores WHERE vendor_id = %s", (current_user["id"],))
    if cur.fetchone():
        cur.close()
        raise HTTPException(status_code=400, detail="You already have a store")

    cur.execute(
        """INSERT INTO stores (vendor_id, name, category, phone, location_text, latitude, longitude, upi_id)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
        (
            current_user["id"],
            body.name,
            body.category,
            body.phone,
            body.location_text,
            body.latitude,
            body.longitude,
            body.upi_id,
        )
    )
    store = dict(cur.fetchone())
    db.commit()
    cur.close()
    store["products"] = []
    return store


@app.put("/stores/{store_id}", tags=["Stores"])
def update_store(
    store_id: str,
    body: StoreUpdate,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    # Check ownership
    cur.execute("SELECT id FROM stores WHERE id = %s AND vendor_id = %s", (store_id, current_user["id"]))
    if not cur.fetchone():
        cur.close()
        raise HTTPException(status_code=403, detail="Not authorized to edit this store")
    
    # Build dynamic update query
    update_fields = []
    values = []
    for field, value in body.model_dump(exclude_unset=True).items():
        update_fields.append(f"{field} = %s")
        values.append(value)
        
    if not update_fields:
        cur.close()
        return {"detail": "No fields to update"}
        
    query = f"UPDATE stores SET {', '.join(update_fields)} WHERE id = %s RETURNING *"
    values.append(store_id)
    
    cur.execute(query, values)
    updated_store = cur.fetchone()
    db.commit()
    cur.close()
    return dict(updated_store)


@app.patch("/stores/{store_id}", tags=["Stores"])
def update_store(
    store_id: str,
    body: StoreUpdate,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT vendor_id FROM stores WHERE id = %s", (store_id,))
    store = cur.fetchone()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    if str(store["vendor_id"]) != str(current_user["id"]):
        raise HTTPException(status_code=403, detail="Not your store")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        cur.close()
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = %s" for k in updates.keys())
    values = list(updates.values()) + [store_id]
    cur.execute(f"UPDATE stores SET {set_clause} WHERE id = %s RETURNING *", values)
    updated = dict(cur.fetchone())
    db.commit()
    cur.close()
    return updated


# ─── Products Endpoints ───────────────────────────────────────────────────────
@app.get("/stores/{store_id}/products", tags=["Products"])
def list_products(store_id: str, db=Depends(get_db)):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        "SELECT * FROM products WHERE store_id = %s ORDER BY name ASC",
        (store_id,)
    )
    products = [dict(p) for p in cur.fetchall()]
    cur.close()
    return products


@app.post("/stores/{store_id}/products", status_code=status.HTTP_201_CREATED, tags=["Products"])
def add_products(
    store_id: str,
    products: List[ProductCreate],
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Verify ownership
    cur.execute("SELECT vendor_id FROM stores WHERE id = %s", (store_id,))
    store = cur.fetchone()
    if not store or str(store["vendor_id"]) != str(current_user["id"]):
        cur.close()
        raise HTTPException(status_code=403, detail="Not your store")

    inserted = []
    for p in products:
        cur.execute(
            """INSERT INTO products (store_id, name, price, unit, category, is_in_stock)
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING *""",
            (store_id, p.name, p.price, p.unit, p.category, p.is_in_stock)
        )
        inserted.append(dict(cur.fetchone()))

    db.commit()
    cur.close()
    return inserted


@app.patch("/products/{product_id}", tags=["Products"])
def update_product(
    product_id: str,
    body: ProductUpdate,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Verify ownership via store → vendor
    cur.execute(
        """SELECT p.*, s.vendor_id FROM products p
           JOIN stores s ON p.store_id = s.id
           WHERE p.id = %s""",
        (product_id,)
    )
    product = cur.fetchone()
    if not product or str(product["vendor_id"]) != str(current_user["id"]):
        cur.close()
        raise HTTPException(status_code=403, detail="Not authorized")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        cur.close()
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = %s" for k in updates.keys())
    values = list(updates.values()) + [product_id]
    cur.execute(f"UPDATE products SET {set_clause} WHERE id = %s RETURNING *", values)
    updated = dict(cur.fetchone())
    db.commit()
    cur.close()
    return updated


@app.delete("/products/{product_id}", status_code=204, tags=["Products"])
def delete_product(
    product_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute(
        """SELECT p.id, s.vendor_id FROM products p
           JOIN stores s ON p.store_id = s.id
           WHERE p.id = %s""",
        (product_id,)
    )
    product = cur.fetchone()
    if not product or str(product["vendor_id"]) != str(current_user["id"]):
        cur.close()
        raise HTTPException(status_code=403, detail="Not authorized")

    cur.execute("DELETE FROM products WHERE id = %s", (product_id,))
    db.commit()
    cur.close()


# ─── Stats Endpoint ───────────────────────────────────────────────────────────
@app.get("/stores/{store_id}/stats", tags=["Stores"])
def get_store_stats(
    store_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT vendor_id FROM stores WHERE id = %s", (store_id,))
    store = cur.fetchone()
    if not store or str(store["vendor_id"]) != str(current_user["id"]):
        cur.close()
        raise HTTPException(status_code=403, detail="Not your store")

    cur.execute("""
        SELECT
            COUNT(*) AS total_products,
            COUNT(*) FILTER (WHERE is_in_stock = TRUE) AS in_stock,
            COUNT(*) FILTER (WHERE is_in_stock = FALSE) AS out_of_stock,
            ROUND(AVG(price)::numeric, 2) AS avg_price,
            MAX(price) AS max_price,
            MIN(price) FILTER (WHERE price > 0) AS min_price
        FROM products
        WHERE store_id = %s
    """, (store_id,))
    stats = dict(cur.fetchone())
    cur.close()
    return stats
