import os
import json
import random
import sqlite3
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from groq import Groq
from jose import JWTError, jwt
from pydantic import BaseModel

from database import get_db, init_db, COVER_COLORS

load_dotenv()

# ── App setup ──────────────────────────────────────────────────────────────

app = FastAPI(title="KindleRead API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_origin_regex=r"https://.*\.(vercel\.app|vercel\.com)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production-12345")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72

security = HTTPBearer(auto_error=False)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── Cover image helper ─────────────────────────────────────────────────────

def fetch_cover_url(title: str, author: str) -> str:
    """Search Open Library for a book cover. Returns URL string or empty string."""
    try:
        query = f"{title} {author}".strip()
        resp = httpx.get(
            "https://openlibrary.org/search.json",
            params={"q": query, "limit": 1, "fields": "cover_i,isbn"},
            timeout=5,
        )
        if resp.status_code != 200:
            return ""
        data = resp.json()
        docs = data.get("docs", [])
        if not docs:
            return ""
        doc = docs[0]
        # Prefer cover_i (cover ID) first
        cover_id = doc.get("cover_i")
        if cover_id:
            return f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"
        # Fall back to first ISBN
        isbns = doc.get("isbn", [])
        if isbns:
            return f"https://covers.openlibrary.org/b/isbn/{isbns[0]}-L.jpg"
        return ""
    except Exception:
        return ""


# ── Startup ────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    init_db()

# ── Auth helpers ───────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_token(user_id: int, username: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    return jwt.encode({"sub": str(user_id), "username": username, "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
        return {"id": user_id, "username": payload.get("username")}
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ── Pydantic schemas ───────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ProgressRequest(BaseModel):
    scroll_position: float
    percent_complete: float

class AddBookRequest(BaseModel):
    title: str
    author: str
    description: str   # short description from AI to use as seed for content generation

# ── Auth routes ────────────────────────────────────────────────────────────

@app.post("/auth/register")
def register(body: RegisterRequest):
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if not body.username.strip():
        raise HTTPException(status_code=400, detail="Username cannot be empty")

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (body.username.strip(), body.email.strip().lower(), hash_password(body.password)),
        )
        conn.commit()
        user_id = cur.lastrowid
        token = create_token(user_id, body.username.strip())
        return {"token": token, "username": body.username.strip(), "email": body.email.strip().lower()}
    except sqlite3.IntegrityError as e:
        err = str(e).lower()
        if "username" in err:
            raise HTTPException(status_code=400, detail="Username already taken")
        raise HTTPException(status_code=400, detail="Email already registered")
    finally:
        conn.close()


@app.post("/auth/login")
def login(body: LoginRequest):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = ?", (body.email.strip().lower(),))
    user = cur.fetchone()
    conn.close()
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user["username"])
    return {"token": token, "username": user["username"], "email": user["email"]}


@app.get("/auth/me")
def me(current_user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, username, email, created_at FROM users WHERE id = ?", (current_user["id"],))
    user = cur.fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(user)

@app.get("/auth/profile")
def profile(current_user=Depends(get_current_user)):
    """Returns user info + full reading stats."""
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT id, username, email, created_at FROM users WHERE id = ?", (current_user["id"],))
    user = cur.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    cur.execute("""
        SELECT rp.book_id, rp.percent_complete, rp.last_read,
               b.title, b.author, b.cover_color, b.cover_url, b.total_words
        FROM reading_progress rp
        JOIN books b ON b.id = rp.book_id
        WHERE rp.user_id = ?
        ORDER BY rp.last_read DESC
    """, (current_user["id"],))
    all_progress = [dict(r) for r in cur.fetchall()]
    conn.close()

    finished   = [p for p in all_progress if p["percent_complete"] >= 99]
    in_progress = [p for p in all_progress if 0 < p["percent_complete"] < 99]
    total_words_read = sum(
        int(p["total_words"] * p["percent_complete"] / 100) for p in all_progress
    )

    return {
        "user": dict(user),
        "stats": {
            "books_completed": len(finished),
            "books_in_progress": len(in_progress),
            "total_words_read": total_words_read,
        },
        "finished": finished,
        "in_progress": in_progress,
    }


# ── Books routes ───────────────────────────────────────────────────────────

@app.get("/books")
def list_books():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, title, author, cover_color, cover_url, total_words, source FROM books ORDER BY id")
    books = [dict(row) for row in cur.fetchall()]
    conn.close()
    return books


@app.get("/books/{book_id}")
def get_book(book_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM books WHERE id = ?", (book_id,))
    book = cur.fetchone()
    conn.close()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return dict(book)


@app.post("/books/add")
def add_ai_book(body: AddBookRequest, current_user=Depends(get_current_user)):
    """
    Add an AI-suggested book to the library.
    Uses Groq to generate a full, readable book summary/content.
    Returns the new book object (including id) so the frontend can navigate to it.
    """
    # Check if this book already exists (case-insensitive title+author match)
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, title, author, cover_color, cover_url, total_words, source FROM books WHERE lower(title) = lower(?) AND lower(author) = lower(?)",
        (body.title.strip(), body.author.strip()),
    )
    existing = cur.fetchone()
    if existing:
        conn.close()
        return {"book": dict(existing), "already_existed": True}

    # Generate content via Groq
    prompt = f"""Write a detailed, engaging, multi-paragraph book summary for "{body.title}" by {body.author}.

Context about the book: {body.description}

Requirements:
- Write 15 to 20 substantial paragraphs
- Cover the full plot arc: setup, conflict, climax, resolution
- Include key characters and their motivations
- Include themes and what makes this book significant
- Write in a flowing, literary narrative style (not bullet points)
- Each paragraph should be separated by a blank line
- Do NOT include any headings, chapter numbers, or markdown formatting — only plain prose paragraphs

Start directly with the book's content."""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a literary writer who creates detailed, engaging book summaries. Write in flowing prose with no markdown formatting."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=2000,
        )
        content = completion.choices[0].message.content.strip()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Failed to generate book content: {str(e)}")

    color = random.choice(COVER_COLORS)
    word_count = len(content.split())
    cover_url = fetch_cover_url(body.title.strip(), body.author.strip())

    cur.execute(
        "INSERT INTO books (title, author, cover_color, cover_url, content, total_words, source) VALUES (?, ?, ?, ?, ?, ?, 'ai_generated')",
        (body.title.strip(), body.author.strip(), color, cover_url, content, word_count),
    )
    conn.commit()
    new_id = cur.lastrowid

    cur.execute("SELECT id, title, author, cover_color, cover_url, total_words, source FROM books WHERE id = ?", (new_id,))
    new_book = dict(cur.fetchone())
    conn.close()

    return {"book": new_book, "already_existed": False}

# ── Progress routes ────────────────────────────────────────────────────────

@app.get("/progress/{book_id}")
def get_progress(book_id: int, current_user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM reading_progress WHERE user_id = ? AND book_id = ?",
        (current_user["id"], book_id),
    )
    progress = cur.fetchone()
    conn.close()
    if not progress:
        return {"scroll_position": 0, "percent_complete": 0, "last_read": None}
    return dict(progress)


@app.post("/progress/{book_id}")
def save_progress(book_id: int, body: ProgressRequest, current_user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO reading_progress (user_id, book_id, scroll_position, percent_complete, last_read)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id, book_id) DO UPDATE SET
            scroll_position  = excluded.scroll_position,
            percent_complete = excluded.percent_complete,
            last_read        = excluded.last_read
        """,
        (current_user["id"], book_id, body.scroll_position, body.percent_complete),
    )
    conn.commit()
    conn.close()
    return {"status": "saved", "percent_complete": body.percent_complete}


@app.get("/progress")
def get_all_progress(current_user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT book_id, percent_complete, last_read FROM reading_progress WHERE user_id = ?",
        (current_user["id"],),
    )
    rows = cur.fetchall()
    conn.close()
    return {row["book_id"]: dict(row) for row in rows}

# ── AI Recommendation route ────────────────────────────────────────────────

@app.post("/recommend")
def get_recommendations(user_preference: str):
    """
    Returns structured JSON with 3 book recommendations.
    Each book has: title, author, description, why_you_ll_love_it
    """
    prompt = f"""Recommend exactly 3 books for someone who enjoys: {user_preference}

Respond ONLY with a valid JSON array. No text before or after the JSON.
Format:
[
  {{
    "title": "Book Title",
    "author": "Author Name",
    "description": "2-3 sentence plot summary",
    "why": "1 sentence on why this matches their taste"
  }},
  ...
]"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a book recommendation assistant. Always respond with valid JSON only, no extra text."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=600,
        )
        raw = completion.choices[0].message.content.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        books = json.loads(raw)
        # Fetch cover photos for each suggested book
        for book in books:
            book["cover_url"] = fetch_cover_url(book.get("title", ""), book.get("author", ""))
        return {"books": books}
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned malformed response. Please try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")


@app.get("/")
def root():
    return {"status": "KindleRead API running", "groq": "connected" if os.getenv("GROQ_API_KEY") else "missing GROQ_API_KEY"}
