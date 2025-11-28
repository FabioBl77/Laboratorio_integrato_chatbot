from typing import Any, Dict, List
import re

from groq import Groq

from .config import settings


class GroqClient:
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model

    def generate_sql(self, prompt: str, table_context: str = "") -> str:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an expert data analyst. Return ONLY a valid BigQuery SQL query with no prose. "
                    "Always use fully-qualified table names (project.dataset.table) and wrap them in backticks. "
                    "If a table name contains spaces, keep the exact name inside backticks. "
                    "Use only the tables provided in the context or, if absent, the default dataset."
                ),
            },
            {
                "role": "user",
                "content": f"Context about tables:\n{table_context or 'Default dataset: ' + settings.bigquery_default_dataset}\n\nRequest: {prompt}",
            },
        ]
        chat = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.2,
        )
        raw_sql = chat.choices[0].message.content.strip()
        sanitized = self._sanitize_sql(raw_sql)
        sanitized = self._qualify_tables(sanitized)
        return sanitized

    def generate_report(self, rows: List[Dict[str, Any]], prompt: str) -> str:
        # Keep payload small: summarize only top rows
        sample = rows[:20]
        messages = [
            {
                "role": "system",
                "content": (
                    "Sei un data storyteller. Fornisci in italiano un report conciso e 1 raccomandazione "
                    "azionabile basata sui dati forniti. Restare sotto le 200 parole."
                ),
            },
            {
                "role": "user",
                "content": f"User request: {prompt}\nSample data: {sample}",
            },
        ]
        chat = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.4,
        )
        return chat.choices[0].message.content.strip()

    def chat(
        self,
        prompt: str,
        history: List[Dict[str, str]] | None = None,
        table_context: str = "",
    ) -> str:
        # Seed with context so the model answers only with the known tables
        messages = [
            {
                "role": "system",
                "content": (
                    "Sei un assistente dati. Rispondi solo usando le tabelle disponibili."
                    f"\nTabelle note:\n{table_context or 'Nessun contesto fornito'}"
                ),
            }
        ]
        if history:
            messages += [{"role": m["role"], "content": m["content"]} for m in history]
        messages.append({"role": "user", "content": prompt})
        chat = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.4,
        )
        return chat.choices[0].message.content.strip()

    def _sanitize_sql(self, text: str) -> str:
        # Remove fenced code blocks and leading "sql" hints
        cleaned = re.sub(r"```sql\s*|\s*```", "", text, flags=re.IGNORECASE).strip()
        cleaned = cleaned.strip("`").strip()
        return cleaned

    def _qualify_tables(self, sql: str) -> str:
        dataset = settings.bigquery_default_dataset
        project = settings.bigquery_project_id
        if not dataset:
            return sql

        # If dataset already includes project (project.dataset), use it as-is
        if "." in dataset:
            dataset_prefix = dataset
        else:
            dataset_prefix = f"{project}.{dataset}" if project else dataset

        def prefix(table: str) -> str:
            return f"{dataset_prefix}.{table}"

        pattern = re.compile(r"\b(from|join)\s+([`\"]?)([A-Za-z_][\w]*)\2", re.IGNORECASE)

        def repl(match):
            table = match.group(3)
            # Skip already qualified tables (contains a dot)
            if "." in table:
                return match.group(0)
            quote = match.group(2) or ""
            return f"{match.group(1)} {quote}{prefix(table)}{quote}"

        return pattern.sub(repl, sql)


groq_client = GroqClient()
