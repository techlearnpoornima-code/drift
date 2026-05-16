import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # LLM (any OpenAI-SDK-compatible endpoint)
    LLM_API_KEY: str = os.environ.get("LLM_API_KEY", "")
    LLM_BASE_URL: str = os.environ.get("LLM_BASE_URL", "https://api.openai.com/v1")
    LLM_MODEL_NAME: str = os.environ.get("LLM_MODEL_NAME", "gpt-4o")

    # Optional faster model for adversary agents
    LLM_BOOST_API_KEY: str = os.environ.get("LLM_BOOST_API_KEY", "")
    LLM_BOOST_BASE_URL: str = os.environ.get("LLM_BOOST_BASE_URL", "")
    LLM_BOOST_MODEL_NAME: str = os.environ.get("LLM_BOOST_MODEL_NAME", "")

    # Zep Cloud
    ZEP_API_KEY: str = os.environ.get("ZEP_API_KEY", "")

    # Flask
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-secret-change-in-prod")
    DEBUG: bool = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    CORS_ORIGINS: list[str] = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")

    # Simulation defaults
    DEFAULT_MAX_ROUNDS: int = int(os.environ.get("DEFAULT_MAX_ROUNDS", "20"))
    UPLOAD_FOLDER: str = os.environ.get("UPLOAD_FOLDER", "uploads")

    # SQLite log path
    SQLITE_DB_PATH: str = os.environ.get("SQLITE_DB_PATH", "drift_logs.db")
