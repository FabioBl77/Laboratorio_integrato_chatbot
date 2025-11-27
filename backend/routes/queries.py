from flask import Blueprint, jsonify, request

from ..bigquery_client import run_query
from ..db import get_session
from ..groq_client import groq_client
from ..models import Request

bp = Blueprint("queries", __name__, url_prefix="/queries")


@bp.get("")
def list_queries():
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"error": "user_id required"}), 400
    with get_session() as session:
        items = (
            session.query(Request)
            .filter(Request.user_id == user_id)
            .order_by(Request.created_at.desc())
            .all()
        )
        return jsonify(
            [
                {
                    "id": req.id,
                    "uuid": req.uuid,
                    "prompt": req.prompt,
                    "sql_text": req.sql_text,
                    "status": req.status,
                    "chart_type": req.chart_type,
                    "result_preview": req.result_preview,
                    "created_at": req.created_at.isoformat(),
                }
                for req in items
            ]
        )


@bp.post("")
def create_query():
    data = request.get_json(force=True)
    prompt = data.get("prompt")
    user_id = data.get("user_id")
    table_context = data.get("table_context", "")
    if not prompt or not user_id:
        return jsonify({"error": "prompt and user_id required"}), 400

    with get_session() as session:
        req = Request(user_id=user_id, prompt=prompt, status="running")
        session.add(req)
        session.flush()  # get id
        try:
            sql = groq_client.generate_sql(prompt=prompt, table_context=table_context)
            if not sql:
                raise ValueError("SQL generata vuota, riprova con una domanda più dettagliata.")
            req.sql_text = sql
            rows = run_query(sql)
            preview = rows[:20] if rows else []
            req.result_preview = preview
            req.status = "done"
        except Exception as exc:
            req.status = "error"
            session.add(req)
            return jsonify({"error": str(exc)}), 500
        return jsonify(
            {
                "id": req.id,
                "uuid": req.uuid,
                "prompt": req.prompt,
                "sql_text": req.sql_text,
                "status": req.status,
                "preview": req.result_preview,
            }
        )


@bp.get("/<int:req_id>")
def query_detail(req_id: int):
    with get_session() as session:
        req = session.get(Request, req_id)
        if not req:
            return jsonify({"error": "Not found"}), 404
        # Copy fields while session is open to avoid detached access
        prompt = req.prompt
        sql_text = req.sql_text
        status = req.status
        chart_type = req.chart_type
        uuid = req.uuid
        rows = req.result_preview or []
    report = groq_client.generate_report(rows=rows, prompt=prompt)
    return jsonify(
        {
            "id": req_id,
            "uuid": uuid,
            "prompt": prompt,
            "sql_text": sql_text,
            "status": status,
            "chart_type": chart_type,
            "preview": rows,
            "report": report,
        }
    )


@bp.delete("/<int:req_id>")
def delete_query(req_id: int):
    with get_session() as session:
        req = session.get(Request, req_id)
        if not req:
            return jsonify({"error": "Not found"}), 404
        session.delete(req)
        return jsonify({"status": "deleted", "id": req_id})
