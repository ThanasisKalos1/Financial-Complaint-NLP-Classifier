"""Vercel Python serverless function for financial complaint triage.

Accepts a POST with JSON body {"texts": ["complaint 1", "complaint 2", ...]} and
returns {"results": [{predicted_product, suggested_team, priority, triage_note}, ...]}.

A single complaint is just a one-element array, so the same endpoint powers both
the single-complaint box and the CSV batch upload in the front-end.

The triage map mirrors src/predict.py in the main project. It is duplicated here
because Vercel bundles only this directory (plus the model via includeFiles), so
the function cannot import from the project's src package.
"""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler
from pathlib import Path

import joblib

TRIAGE_MAP = {
    "credit_card": {
        "team": "Credit Card Servicing Team",
        "priority": "Standard review",
        "note": "Review fees, interest, payments, disputes, or card account servicing.",
    },
    "credit_reporting": {
        "team": "Credit Reporting Disputes Team",
        "priority": "Compliance review",
        "note": "Check bureau reporting, incorrect tradelines, identity theft, or dispute handling.",
    },
    "debt_collection": {
        "team": "Debt Collection Review Team",
        "priority": "Compliance review",
        "note": "Review collector contact, disputed debt, validation notices, and collection conduct.",
    },
    "mortgages_and_loans": {
        "team": "Mortgage and Loan Servicing Team",
        "priority": "Standard review",
        "note": "Review loan servicing, mortgage payments, modification, escrow, or payoff issues.",
    },
    "retail_banking": {
        "team": "Retail Banking Operations Team",
        "priority": "Standard review",
        "note": "Review deposit accounts, transfers, overdrafts, holds, and transaction disputes.",
    },
}

DEFAULT_TRIAGE = {
    "team": "Manual Review Team",
    "priority": "Manual review",
    "note": "No routing rule found for this predicted category.",
}

MODEL_FILENAME = "complaint_classifier.joblib"

# Hard cap so a huge CSV cannot exhaust the function's time/memory budget.
MAX_TEXTS = 2000

_model = None


def _find_model_path() -> Path:
    """Locate the bundled model artifact across local and Vercel layouts."""
    here = Path(__file__).resolve()
    candidates = [
        here.parent.parent / MODEL_FILENAME,  # web/complaint_classifier.joblib (includeFiles)
        Path.cwd() / MODEL_FILENAME,
        Path("/var/task") / MODEL_FILENAME,
        here.parent / MODEL_FILENAME,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(
        f"Could not find {MODEL_FILENAME}. Looked in: "
        + ", ".join(str(c) for c in candidates)
    )


def get_model():
    global _model
    if _model is None:
        _model = joblib.load(_find_model_path())
    return _model


def triage_for(product: str) -> dict[str, str]:
    info = TRIAGE_MAP.get(product, DEFAULT_TRIAGE)
    return {
        "predicted_product": product,
        "suggested_team": info["team"],
        "priority": info["priority"],
        "triage_note": info["note"],
    }


def classify(texts: list[str]) -> list[dict[str, str]]:
    model = get_model()
    predictions = model.predict(texts)
    return [triage_for(str(product)) for product in predictions]


class handler(BaseHTTPRequestHandler):
    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802 (Vercel/BaseHTTPRequestHandler API)
        # Lightweight health check that also confirms the model loads.
        try:
            get_model()
            self._send(200, {"status": "ok", "model": MODEL_FILENAME})
        except Exception as exc:  # noqa: BLE001
            self._send(500, {"error": str(exc)})

    def do_POST(self) -> None:  # noqa: N802
        try:
            length = int(self.headers.get("content-length", 0) or 0)
            raw = self.rfile.read(length) if length else b"{}"
            data = json.loads(raw or b"{}")
        except (ValueError, json.JSONDecodeError):
            self._send(400, {"error": "Request body must be valid JSON."})
            return

        texts = data.get("texts")
        if not isinstance(texts, list) or not texts:
            self._send(
                400,
                {"error": 'Body must include a non-empty "texts" array of strings.'},
            )
            return

        # Keep only non-empty strings; remember original positions for the response.
        cleaned: list[str] = []
        for item in texts:
            cleaned.append(str(item).strip() if item is not None else "")

        if len(cleaned) > MAX_TEXTS:
            self._send(
                413,
                {"error": f"Too many rows. Limit is {MAX_TEXTS} complaints per request."},
            )
            return

        try:
            results: list[dict | None] = [None] * len(cleaned)
            to_predict = [(i, t) for i, t in enumerate(cleaned) if t]
            if to_predict:
                preds = classify([t for _, t in to_predict])
                for (idx, _), pred in zip(to_predict, preds):
                    results[idx] = pred
            # Fill blank rows with an explicit, non-crashing result.
            for i, value in enumerate(results):
                if value is None:
                    results[i] = {
                        "predicted_product": "",
                        "suggested_team": "",
                        "priority": "Skipped",
                        "triage_note": "Empty complaint text.",
                    }
        except FileNotFoundError as exc:
            self._send(500, {"error": str(exc)})
            return
        except Exception as exc:  # noqa: BLE001
            self._send(500, {"error": f"Prediction failed: {exc}"})
            return

        self._send(200, {"results": results})


# Allow `python api/predict.py` to run a quick local smoke test without Vercel.
if __name__ == "__main__":
    os.chdir(Path(__file__).resolve().parent.parent)
    sample = [
        "There is an incorrect late payment on my credit report.",
        "The debt collector keeps calling me about a debt I already paid.",
        "My mortgage escrow payment was miscalculated this year.",
    ]
    for text, result in zip(sample, classify(sample)):
        print(f"\n> {text}")
        print(json.dumps(result, indent=2))
