from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from ..db import get_session
from ..models import User

bp = Blueprint("auth", __name__, url_prefix="/auth")


@bp.post("/register")
def register():
    data = request.get_json(force=True)
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    with get_session() as session:
        if session.query(User).filter_by(email=email).first():
            return jsonify({"error": "User already exists"}), 409
        user = User(email=email, password_hash=generate_password_hash(password))
        session.add(user)
        session.flush()
        return jsonify({"id": user.id, "email": user.email}), 201


@bp.post("/login")
def login():
    data = request.get_json(force=True)
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    with get_session() as session:
        user = session.query(User).filter_by(email=email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid credentials"}), 401
        # In a real app you would return a JWT or session token
        return jsonify({"id": user.id, "email": user.email}), 200
