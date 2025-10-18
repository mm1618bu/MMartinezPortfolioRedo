# soda_predictor.py
# ML-based soda purchase predictor with in-script dataset (no external files).

from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import classification_report, confusion_matrix

# ----------------------------
# 1) In-script training data
# ----------------------------
# Each row is one historical purchase with simple behavioral & context features.
# Feel free to add more rows—more data will usually improve accuracy.
DATA: List[Dict] = [
    # age_group: teen/young_adult/adult/senior
    # time_of_day: morning/afternoon/evening/late_night
    # weather: hot/mild/cold
    # sweetness: low/medium/high (customer taste)
    # caffeine_need: low/medium/high (self-reported or inferred)
    # price_sensitivity: low/high
    # diet: regular/diet/zero
    # flavor: cola/citrus/fruit/vanilla/spice
    # brand_loyalty: none/coke/pepsi/mtn_dew/sprite/dr_pepper/fanta
    # label (target): Coke, Diet Coke, Pepsi, Diet Pepsi, Sprite, Mountain Dew, Dr Pepper, Fanta Orange
    dict(age_group="teen",  time_of_day="afternoon", weather="hot",  sweetness="high",   caffeine_need="high",  price_sensitivity="low",  diet="regular", flavor="citrus",  brand_loyalty="mtn_dew",  label="Mountain Dew"),
    dict(age_group="teen",  time_of_day="evening",   weather="mild", sweetness="high",   caffeine_need="high",  price_sensitivity="high", diet="regular", flavor="cola",    brand_loyalty="pepsi",     label="Pepsi"),
    dict(age_group="young_adult", time_of_day="late_night", weather="mild", sweetness="medium", caffeine_need="high",  price_sensitivity="low",  diet="regular", flavor="cola",    brand_loyalty="coke",      label="Coke"),
    dict(age_group="adult", time_of_day="morning",   weather="mild", sweetness="low",    caffeine_need="low",   price_sensitivity="low",  diet="diet",    flavor="cola",    brand_loyalty="coke",      label="Diet Coke"),
    dict(age_group="adult", time_of_day="afternoon", weather="hot",  sweetness="low",    caffeine_need="low",   price_sensitivity="high", diet="zero",    flavor="cola",    brand_loyalty="coke",      label="Diet Coke"),
    dict(age_group="adult", time_of_day="evening",   weather="hot",  sweetness="medium", caffeine_need="low",   price_sensitivity="low",  diet="regular", flavor="citrus",  brand_loyalty="sprite",    label="Sprite"),
    dict(age_group="adult", time_of_day="afternoon", weather="hot",  sweetness="medium", caffeine_need="low",   price_sensitivity="high", diet="regular", flavor="citrus",  brand_loyalty="sprite",    label="Sprite"),
    dict(age_group="adult", time_of_day="evening",   weather="mild", sweetness="high",   caffeine_need="medium",price_sensitivity="low",  diet="regular", flavor="spice",   brand_loyalty="dr_pepper", label="Dr Pepper"),
    dict(age_group="adult", time_of_day="evening",   weather="cold", sweetness="high",   caffeine_need="medium",price_sensitivity="high", diet="regular", flavor="spice",   brand_loyalty="dr_pepper", label="Dr Pepper"),
    dict(age_group="young_adult", time_of_day="afternoon", weather="hot", sweetness="medium", caffeine_need="medium", price_sensitivity="low", diet="regular", flavor="cola", brand_loyalty="coke", label="Coke"),
    dict(age_group="young_adult", time_of_day="evening", weather="mild", sweetness="medium", caffeine_need="medium", price_sensitivity="low", diet="regular", flavor="cola", brand_loyalty="pepsi", label="Pepsi"),
    dict(age_group="senior", time_of_day="afternoon", weather="mild", sweetness="low", caffeine_need="low", price_sensitivity="low", diet="diet", flavor="cola", brand_loyalty="pepsi", label="Diet Pepsi"),
    dict(age_group="senior", time_of_day="evening", weather="mild", sweetness="low", caffeine_need="low", price_sensitivity="high", diet="diet", flavor="cola", brand_loyalty="coke", label="Diet Coke"),
    dict(age_group="senior", time_of_day="afternoon", weather="hot", sweetness="low", caffeine_need="low", price_sensitivity="low", diet="zero", flavor="cola", brand_loyalty="pepsi", label="Diet Pepsi"),
    dict(age_group="teen", time_of_day="afternoon", weather="hot", sweetness="high", caffeine_need="low", price_sensitivity="low", diet="regular", flavor="fruit", brand_loyalty="fanta", label="Fanta Orange"),
    dict(age_group="teen", time_of_day="evening", weather="mild", sweetness="high", caffeine_need="low", price_sensitivity="high", diet="regular", flavor="fruit", brand_loyalty="fanta", label="Fanta Orange"),
    dict(age_group="young_adult", time_of_day="afternoon", weather="hot", sweetness="medium", caffeine_need="low", price_sensitivity="low", diet="regular", flavor="citrus", brand_loyalty="sprite", label="Sprite"),
    dict(age_group="young_adult", time_of_day="late_night", weather="mild", sweetness="medium", caffeine_need="high", price_sensitivity="low", diet="regular", flavor="citrus", brand_loyalty="mtn_dew", label="Mountain Dew"),
    dict(age_group="adult", time_of_day="late_night", weather="mild", sweetness="medium", caffeine_need="high", price_sensitivity="low", diet="regular", flavor="cola", brand_loyalty="pepsi", label="Pepsi"),
    dict(age_group="adult", time_of_day="evening", weather="hot", sweetness="medium", caffeine_need="low", price_sensitivity="low", diet="regular", flavor="fruit", brand_loyalty="fanta", label="Fanta Orange"),
    dict(age_group="adult", time_of_day="afternoon", weather="mild", sweetness="low", caffeine_need="medium", price_sensitivity="high", diet="diet", flavor="cola", brand_loyalty="pepsi", label="Diet Pepsi"),
    dict(age_group="adult", time_of_day="morning", weather="mild", sweetness="low", caffeine_need="medium", price_sensitivity="low", diet="zero", flavor="cola", brand_loyalty="coke", label="Diet Coke"),
    dict(age_group="young_adult", time_of_day="morning", weather="mild", sweetness="medium", caffeine_need="medium", price_sensitivity="high", diet="regular", flavor="cola", brand_loyalty="coke", label="Coke"),
    dict(age_group="teen", time_of_day="evening", weather="cold", sweetness="high", caffeine_need="medium", price_sensitivity="high", diet="regular", flavor="spice", brand_loyalty="dr_pepper", label="Dr Pepper"),
    dict(age_group="adult", time_of_day="afternoon", weather="cold", sweetness="low", caffeine_need="low", price_sensitivity="high", diet="diet", flavor="cola", brand_loyalty="pepsi", label="Diet Pepsi"),
    dict(age_group="senior", time_of_day="afternoon", weather="hot", sweetness="low", caffeine_need="low", price_sensitivity="low", diet="regular", flavor="citrus", brand_loyalty="sprite", label="Sprite"),
    dict(age_group="senior", time_of_day="evening", weather="mild", sweetness="low", caffeine_need="low", price_sensitivity="low", diet="regular", flavor="cola", brand_loyalty="coke", label="Coke"),
    dict(age_group="young_adult", time_of_day="evening", weather="hot", sweetness="high", caffeine_need="high", price_sensitivity="low", diet="regular", flavor="spice", brand_loyalty="dr_pepper", label="Dr Pepper"),
    dict(age_group="teen", time_of_day="afternoon", weather="hot", sweetness="high", caffeine_need="medium", price_sensitivity="low", diet="regular", flavor="cola", brand_loyalty="pepsi", label="Pepsi"),
    dict(age_group="adult", time_of_day="evening", weather="mild", sweetness="medium", caffeine_need="medium", price_sensitivity="low", diet="regular", flavor="cola", brand_loyalty="coke", label="Coke"),
    dict(age_group="adult", time_of_day="evening", weather="mild", sweetness="medium", caffeine_need="low", price_sensitivity="low", diet="regular", flavor="vanilla", brand_loyalty="coke", label="Coke"),
    dict(age_group="young_adult", time_of_day="afternoon", weather="hot", sweetness="high", caffeine_need="high", price_sensitivity="low", diet="regular", flavor="citrus", brand_loyalty="mtn_dew", label="Mountain Dew"),
    dict(age_group="teen", time_of_day="afternoon", weather="hot", sweetness="medium", caffeine_need="low", price_sensitivity="low", diet="regular", flavor="citrus", brand_loyalty="sprite", label="Sprite"),
    dict(age_group="senior", time_of_day="morning", weather="mild", sweetness="low", caffeine_need="low", price_sensitivity="high", diet="diet", flavor="cola", brand_loyalty="pepsi", label="Diet Pepsi"),
    dict(age_group="adult", time_of_day="late_night", weather="mild", sweetness="medium", caffeine_need="high", price_sensitivity="high", diet="regular", flavor="cola", brand_loyalty="coke", label="Pepsi"),  # a counterexample
]

# ----------------------------
# 2) Schema / allowed values
# ----------------------------
CATEGORICAL = [
    "age_group", "time_of_day", "weather", "sweetness", "caffeine_need",
    "price_sensitivity", "diet", "flavor", "brand_loyalty"
]
NUMERIC: List[str] = []  # Add numeric features later if you collect them (e.g., temperature, price)

LABEL = "label"

ALLOWED_VALUES = {
    "age_group": ["teen", "young_adult", "adult", "senior"],
    "time_of_day": ["morning", "afternoon", "evening", "late_night"],
    "weather": ["hot", "mild", "cold"],
    "sweetness": ["low", "medium", "high"],
    "caffeine_need": ["low", "medium", "high"],
    "price_sensitivity": ["low", "high"],
    "diet": ["regular", "diet", "zero"],
    "flavor": ["cola", "citrus", "fruit", "vanilla", "spice"],
    "brand_loyalty": ["none", "coke", "pepsi", "mtn_dew", "sprite", "dr_pepper", "fanta"],
}

# ----------------------------
# 3) Model pipeline
# ----------------------------
def build_pipeline() -> Pipeline:
    transformers = []
    if CATEGORICAL:
        transformers.append(("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL))
    if NUMERIC:
        transformers.append(("num", StandardScaler(), NUMERIC))

    preproc = ColumnTransformer(transformers)
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    pipe = Pipeline([("prep", preproc), ("clf", model)])
    return pipe

# ----------------------------
# 4) Training / Evaluation
# ----------------------------
def load_frame(data: List[Dict]) -> Tuple[pd.DataFrame, pd.Series]:
    df = pd.DataFrame(data)
    X = df[[*CATEGORICAL, *NUMERIC]]
    y = df[LABEL]
    return X, y

def evaluate(pipe: Pipeline, X: pd.DataFrame, y: pd.Series) -> None:
    # Quick CV for small data sanity check
    scores = cross_val_score(pipe, X, y, cv=5, scoring="accuracy")
    print(f"[CV] Accuracy: mean={scores.mean():.3f}, std={scores.std():.3f}  (k=5)")

    # Train/test split report
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    pipe.fit(X_tr, y_tr)
    y_pred = pipe.predict(X_te)
    print("\n[Test] Classification Report")
    print(classification_report(y_te, y_pred))
    print("[Test] Confusion Matrix")
    print(confusion_matrix(y_te, y_pred))

# ----------------------------
# 5) Inference helper
# ----------------------------
@dataclass
class SodaFeatures:
    age_group: str
    time_of_day: str
    weather: str
    sweetness: str
    caffeine_need: str
    price_sensitivity: str
    diet: str
    flavor: str
    brand_loyalty: str

def validate_features(f: Dict) -> None:
    for k, allowed in ALLOWED_VALUES.items():
        if k not in f:
            raise ValueError(f"Missing required feature: {k}")
        if f[k] not in allowed:
            raise ValueError(f"Invalid value for '{k}': '{f[k]}'. Allowed: {allowed}")

def predict_soda(pipe: Pipeline, features: Dict, top_k: int = 3) -> List[Tuple[str, float]]:
    """Return top-k (label, probability) predictions."""
    validate_features(features)
    Xq = pd.DataFrame([features])[CATEGORICAL + NUMERIC]
    probs = pipe.predict_proba(Xq)[0]
    labels = pipe.classes_
    order = np.argsort(probs)[::-1]
    top = [(labels[i], float(probs[i])) for i in order[:top_k]]
    return top

# ----------------------------
# 6) Example usage
# ----------------------------
if __name__ == "__main__":
    X, y = load_frame(DATA)
    pipe = build_pipeline()
    evaluate(pipe, X, y)

    # Fit on all data for deployment (simple demo—consider proper validation in production)
    pipe.fit(X, y)

    # Example: predict for a new shopper profile
    new_customer = dict(
        age_group="young_adult",
        time_of_day="afternoon",
        weather="hot",
        sweetness="medium",
        caffeine_need="high",
        price_sensitivity="low",
        diet="regular",
        flavor="citrus",
        brand_loyalty="mtn_dew"
    )

    print("\nNew customer features:", new_customer)
    top_preds = predict_soda(pipe, new_customer, top_k=3)
    print("Top predictions:")
    for label, p in top_preds:
        print(f"  {label:14s}  {p:.2%}")
