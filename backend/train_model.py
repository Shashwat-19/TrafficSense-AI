"""
TrafficSense AI — XGBoost model training pipeline.

Generates synthetic Bangalore traffic data with realistic patterns and
trains an XGBoost regressor to predict traffic speed.

Usage:
    python train_model.py
"""

import os

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib


def create_training_data(n_days: int = 90, n_segments: int = 25) -> tuple[pd.DataFrame, np.ndarray]:
    """
    Generate synthetic but realistic Bangalore traffic training data.

    Features:
        hour, day_of_week, is_weekend, segment_idx, free_flow_speed,
        lag_speed_1h, lag_congestion_1h, temperature, is_rainy

    Target:
        current_speed (km/h)

    Uses time-aware structure: consecutive hours across days to support
    proper time-based train/test splitting.
    """
    np.random.seed(42)

    records: list[dict] = []
    free_flow_speeds = np.random.uniform(25, 80, n_segments)

    for day in range(n_days):
        dow = day % 7
        is_weekend = int(dow >= 5)
        temp_base = np.random.uniform(20, 35)  # Bangalore daily temp range
        is_rainy = int(np.random.random() < 0.25)  # ~25% rainy days

        for hour in range(24):
            temperature = temp_base + np.random.uniform(-3, 3)

            # Time-of-day congestion pattern
            if 8 <= hour <= 10:
                time_factor = 0.85 + np.random.uniform(0, 0.15)
            elif 17 <= hour <= 20:
                time_factor = 0.80 + np.random.uniform(0, 0.20)
            elif 12 <= hour <= 14:
                time_factor = 0.45 + np.random.uniform(0, 0.15)
            elif 22 <= hour or hour <= 5:
                time_factor = 0.05 + np.random.uniform(0, 0.10)
            else:
                time_factor = 0.30 + np.random.uniform(0, 0.20)

            # Weekend factor
            if is_weekend:
                time_factor *= 0.6

            # Rain increases congestion
            if is_rainy:
                time_factor *= 1.2

            for seg_idx in range(n_segments):
                ffs = free_flow_speeds[seg_idx]
                road_factor = time_factor * np.random.uniform(0.6, 1.4)
                road_factor = np.clip(road_factor, 0, 1)

                speed = ffs * (1 - road_factor) + np.random.normal(0, 3)
                speed = np.clip(speed, 2, ffs)

                # Lag features (approximate: from same segment, 1h earlier)
                lag_speed = ffs * (1 - time_factor * np.random.uniform(0.5, 1.2)) + np.random.normal(0, 2)
                lag_speed = np.clip(lag_speed, 2, ffs)
                lag_congestion = np.clip(1 - lag_speed / ffs, 0, 1)

                records.append({
                    "day": day,
                    "hour": hour,
                    "day_of_week": dow,
                    "is_weekend": is_weekend,
                    "segment_idx": seg_idx,
                    "free_flow_speed": ffs,
                    "lag_speed_1h": lag_speed,
                    "lag_congestion_1h": lag_congestion,
                    "temperature": temperature,
                    "is_rainy": is_rainy,
                    "speed": speed,
                })

    df = pd.DataFrame(records)
    target = df.pop("speed").values
    return df, target


def train_model():
    """Train the XGBoost model with time-aware split."""
    print("=" * 60)
    print("TrafficSense AI — Model Training Pipeline")
    print("=" * 60)

    print("\n[1/4] Generating training data…")
    df, target = create_training_data()
    print(f"  Dataset: {len(df):,} samples, {df.shape[1]} features")

    # Time-aware split: use first 70 days for train, next 10 for val, last 10 for test
    print("\n[2/4] Splitting data (time-aware)…")
    features = ["hour", "day_of_week", "is_weekend", "segment_idx",
                 "free_flow_speed", "lag_speed_1h", "lag_congestion_1h",
                 "temperature", "is_rainy"]

    train_mask = df["day"] < 63
    val_mask = (df["day"] >= 63) & (df["day"] < 77)
    test_mask = df["day"] >= 77

    X_train, y_train = df.loc[train_mask, features], target[train_mask]
    X_val, y_val = df.loc[val_mask, features], target[val_mask]
    X_test, y_test = df.loc[test_mask, features], target[test_mask]

    print(f"  Train: {len(X_train):,}  Val: {len(X_val):,}  Test: {len(X_test):,}")

    print("\n[3/4] Training XGBoost model…")
    model = xgb.XGBRegressor(
        objective="reg:squarederror",
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False,
    )

    # Evaluate on test set
    print("\n[4/4] Evaluating on test set…")
    preds = model.predict(X_test)

    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)

    print(f"  MAE:  {mae:.3f} km/h")
    print(f"  RMSE: {rmse:.3f} km/h")
    print(f"  R²:   {r2:.4f}")

    # Feature importance
    print("\n  Feature importance:")
    importances = model.feature_importances_
    for feat, imp in sorted(zip(features, importances), key=lambda x: -x[1]):
        print(f"    {feat:>20s}: {imp:.4f}")

    # Save model
    output_dir = os.path.join(os.path.dirname(__file__), "app", "models", "artifacts")
    os.makedirs(output_dir, exist_ok=True)
    model_path = os.path.join(output_dir, "xgb_speed_model.pkl")
    joblib.dump(model, model_path)
    print(f"\n  Model saved to: {model_path}")
    print("=" * 60)


if __name__ == "__main__":
    train_model()
