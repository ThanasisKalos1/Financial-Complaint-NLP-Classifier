from __future__ import annotations

import argparse
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


def load_model(model_path: Path):
    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found at {model_path}. "
            "Run `python -m src.train` first to create it."
        )
    return joblib.load(model_path)


def predict_complaint(text: str, model_path: Path) -> dict[str, str]:
    model = load_model(model_path)
    predicted_product = model.predict([text])[0]
    triage = TRIAGE_MAP.get(
        predicted_product,
        {
            "team": "Manual Review Team",
            "priority": "Manual review",
            "note": "No routing rule found for this predicted category.",
        },
    )
    return {
        "predicted_product": predicted_product,
        "suggested_team": triage["team"],
        "priority": triage["priority"],
        "triage_note": triage["note"],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Predict the product category for a financial complaint."
    )
    parser.add_argument("complaint", help="Complaint narrative text.")
    parser.add_argument(
        "--model",
        type=Path,
        default=Path("models/complaint_classifier.joblib"),
        help="Path to the trained model artifact.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    result = predict_complaint(args.complaint, args.model)
    print(f"Predicted product: {result['predicted_product']}")
    print(f"Suggested team: {result['suggested_team']}")
    print(f"Priority: {result['priority']}")
    print(f"Note: {result['triage_note']}")
