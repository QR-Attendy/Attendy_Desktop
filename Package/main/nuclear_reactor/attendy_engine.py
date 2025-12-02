from flask import Flask, request, jsonify
import sqlite3
import qrcode
from PIL import Image
from io import BytesIO
import base64
import json
import os

app = Flask(__name__)

# Resolve DB path to work in both dev + packaged mode
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "attendy.db")

# ---------------------------------
# Database Initialization
# ---------------------------------
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ---------------------------------
# QR Generator
# ---------------------------------
def generate_qr(fullname, username, role, logo_path=None):
    payload = {"fullname": fullname, "username": username, "role": role}

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4
    )
    qr.add_data(json.dumps(payload))
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")

    # Optional Logo Support
    if logo_path and os.path.exists(logo_path):
        try:
            logo = Image.open(logo_path).convert("RGBA")
            logo_size = int(img.size[0] * 0.20)
            logo.thumbnail((logo_size, logo_size), Image.LANCZOS)
            pos = ((img.size[0] - logo.size[0]) // 2,
                   (img.size[1] - logo.size[1]) // 2)
            img.paste(logo, pos, logo)
        except Exception as e:
            print("Logo error:", e)

    buffer = BytesIO()
    img.save(buffer, format="PNG")
    qr_bytes = buffer.getvalue()
    buffer.close()

    return base64.b64encode(qr_bytes).decode("ascii")

# ---------------------------------
# REST API Routes
# ---------------------------------

@app.route("/create_user", methods=["POST"])
def create_user():
    try:
        data = request.get_json()
        fullname = data["fullname"]
        username = data["username"]
        role = data["role"]

        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE username = ?", (username,))
        existing = c.fetchone()

        if not existing:
            c.execute("INSERT INTO users(fullname, username, role) VALUES (?,?,?)",
                      (fullname, username, role))
            conn.commit()
            c.execute("SELECT * FROM users WHERE username = ?", (username,))
            user = c.fetchone()
        else:
            user = existing

        conn.close()

        # Auto-generate QR on registration
        qr_b64 = generate_qr(fullname, username, role)

        return jsonify({
            "status": "ok",
            "id": user[0],
            "fullname": user[1],
            "username": user[2],
            "role": user[3],
            "qr_base64": qr_b64
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/generate_qr", methods=["POST"])
def qr_api():
    try:
        data = request.get_json()
        fullname = data["fullname"]
        username = data["username"]
        role = data["role"]
        logo_path = data.get("logo_path", None)

        qr_b64 = generate_qr(fullname, username, role, logo_path)

        return jsonify({
            "status": "ok",
            "qr_base64": qr_b64
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ---------------------------------
# Run Server
# ---------------------------------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5005)
    