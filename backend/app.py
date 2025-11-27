from flask import Flask, jsonify
from flask_cors import CORS

from .db import Base, engine
from .routes import auth, chat, queries


def create_app():
    app = Flask(__name__)
    CORS(app)

    # Create tables if not present
    Base.metadata.create_all(bind=engine)

    app.register_blueprint(auth.bp)
    app.register_blueprint(chat.bp)
    app.register_blueprint(queries.bp)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
