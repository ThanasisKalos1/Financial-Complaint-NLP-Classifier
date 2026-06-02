from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC


def load_training_data(data_path: Path) -> pd.DataFrame:
    df = pd.read_csv(data_path, index_col=0)
    df.columns = df.columns.str.lower()
    df = df[["product", "narrative"]].dropna().copy()
    df["narrative"] = df["narrative"].astype(str).str.strip()
    df = df[df["narrative"].ne("")].copy()

    rows_before_dedup = len(df)
    df = df.drop_duplicates(subset="narrative").copy()
    duplicates_removed = rows_before_dedup - len(df)

    print(f"Rows after cleaning: {len(df):,}")
    print(f"Exact duplicate narratives removed: {duplicates_removed:,}")
    return df


def build_classifier(random_state: int = 42) -> Pipeline:
    return Pipeline(
        [
            (
                "vectorizer",
                TfidfVectorizer(
                    ngram_range=(1, 3),
                    min_df=3,
                    max_df=0.95,
                    max_features=100000,
                    stop_words="english",
                ),
            ),
            (
                "classifier",
                LinearSVC(
                    class_weight="balanced",
                    C=0.5,
                    random_state=random_state,
                ),
            ),
        ]
    )


def save_confusion_matrix(
    y_true: pd.Series,
    y_pred,
    labels: list[str],
    output_path: Path,
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    cm = confusion_matrix(y_true, y_pred, labels=labels)
    cm_df = pd.DataFrame(cm, index=labels, columns=labels)

    plt.figure(figsize=(9, 7))
    sns.heatmap(cm_df, annot=True, fmt="d", cmap="Greens")
    plt.title("Confusion Matrix - Selected Model")
    plt.xlabel("Predicted label")
    plt.ylabel("True label")
    plt.xticks(rotation=35, ha="right")
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(output_path, dpi=160, bbox_inches="tight")
    plt.close()


def train(
    data_path: Path,
    model_out: Path,
    figure_out: Path,
    test_size: float,
    random_state: int,
) -> None:
    df = load_training_data(data_path)
    labels = sorted(df["product"].unique())

    x_train, x_test, y_train, y_test = train_test_split(
        df["narrative"],
        df["product"],
        test_size=test_size,
        random_state=random_state,
        stratify=df["product"],
    )

    model = build_classifier(random_state=random_state)
    model.fit(x_train, y_train)
    y_pred = model.predict(x_test)

    print(classification_report(y_test, y_pred))
    print(f"Macro F1: {f1_score(y_test, y_pred, average='macro'):.4f}")
    print(f"Weighted F1: {f1_score(y_test, y_pred, average='weighted'):.4f}")

    model_out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_out)
    print(f"Saved model to: {model_out}")

    save_confusion_matrix(y_test, y_pred, labels, figure_out)
    print(f"Saved confusion matrix to: {figure_out}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train the financial complaint NLP classifier."
    )
    parser.add_argument(
        "--data",
        type=Path,
        default=Path("complaints_processed.csv"),
        help="Path to complaints_processed.csv.",
    )
    parser.add_argument(
        "--model-out",
        type=Path,
        default=Path("models/complaint_classifier.joblib"),
        help="Where to save the trained model artifact.",
    )
    parser.add_argument(
        "--figure-out",
        type=Path,
        default=Path("reports/figures/confusion_matrix.png"),
        help="Where to save the confusion matrix image.",
    )
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--random-state", type=int, default=42)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    train(
        data_path=args.data,
        model_out=args.model_out,
        figure_out=args.figure_out,
        test_size=args.test_size,
        random_state=args.random_state,
    )
