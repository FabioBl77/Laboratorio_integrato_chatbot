import json
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

# Load env vars from a local .env if present
load_dotenv()


@dataclass
class Settings:
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    db_dialect: str = os.getenv("DB_DIALECT", "mysql+pymysql")
    db_host: str = os.getenv("DB_HOST", "")
    db_port: str = os.getenv("DB_PORT", "")
    db_name: str = os.getenv("DB_NAME", "")
    db_user: str = os.getenv("DB_USER", "")
    db_password: str = os.getenv("DB_PASSWORD", "")

    # BigQuery service account JSON as inline env or path to file
    bigquery_service_account_json: str = os.getenv("BIGQUERY_SERVICE_ACCOUNT_JSON", "")
    bigquery_credentials_path: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    bigquery_project_id: str = os.getenv("BIGQUERY_PROJECT_ID", "")
    bigquery_default_dataset: str = os.getenv("BIGQUERY_DEFAULT_DATASET", "")

    @property
    def database_url(self) -> str:
        return (
            f"{self.db_dialect}://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def bigquery_credentials_dict(self):
        if self.bigquery_service_account_json:
            return json.loads(self.bigquery_service_account_json)
        if self.bigquery_credentials_path:
            path = Path(self.bigquery_credentials_path)
            if path.exists():
                return json.loads(path.read_text())
        return None


settings = Settings()
