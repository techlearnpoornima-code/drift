from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.db import init_db
from app.routes.compare import compare_bp
from app.routes.ingestion import ingestion_bp
from app.routes.report import report_bp
from app.routes.simulation import simulation_bp


def create_app(config: Config | None = None) -> Flask:
    app = Flask(__name__)

    cfg = config or Config()
    app.config.from_object(cfg)

    CORS(app, resources={r"/api/*": {"origins": cfg.CORS_ORIGINS}})

    init_db(cfg.SQLITE_DB_PATH)

    app.register_blueprint(ingestion_bp)
    app.register_blueprint(simulation_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(compare_bp)

    return app
