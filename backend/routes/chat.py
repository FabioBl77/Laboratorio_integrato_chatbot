from flask import Blueprint, jsonify, request

from ..db import get_session
from ..groq_client import groq_client
from ..models import Request

bp = Blueprint("chat", __name__, url_prefix="/chat")


def build_table_context() -> str:
    """Aggrega prompt e SQL precedenti per dare contesto al modello."""
    lines = []
    try:
        with get_session() as session:
            rows = session.query(Request.prompt, Request.sql_text).all()
        for prompt, sql in rows:
            if not sql:
                continue
            lines.append(f"{prompt} -> {sql}")
    except Exception:
        # Se il DB non è raggiungibile, restituisce contesto vuoto per non bloccare il chatbot
        return ""
    return "\n".join(lines)


@bp.post("")
def chat():
    data = request.get_json(force=True)
    prompt = data.get("prompt", "")
    history = data.get("history", [])
    # Preferisce il contesto dal client (dashboard); se assente prova a ricavarlo dal DB
    table_context = data.get("table_context") or build_table_context()
    if not prompt:
        return jsonify({"error": "Prompt required"}), 400
    reply = groq_client.chat(prompt=prompt, history=history, table_context=table_context)
    return jsonify({"reply": reply})
