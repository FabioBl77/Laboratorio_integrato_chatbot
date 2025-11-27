from typing import Any, Dict, List

from google.cloud import bigquery
from google.oauth2 import service_account

from .config import settings


def _build_client() -> bigquery.Client:
    if settings.bigquery_credentials_dict:
        creds = service_account.Credentials.from_service_account_info(
            settings.bigquery_credentials_dict
        )
        return bigquery.Client(credentials=creds, project=settings.bigquery_project_id or creds.project_id)
    # Falls back to Application Default Credentials if configured
    return bigquery.Client(project=settings.bigquery_project_id or None)


def run_query(sql: str) -> List[Dict[str, Any]]:
    client = _build_client()
    query_job = client.query(sql)
    rows = query_job.result()
    results = []
    for row in rows:
        results.append(dict(row.items()))
    return results
